import { handleMultiCollegeRoute, createTenantOrder, verifyTenantCheckout, reconcileTenantWebhook } from "./multi-college.js";
const json = (data, status = 200, headers = {}) => new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", ...headers } });
const enc = new TextEncoder();
const hex = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2,"0")).join("");
const b64url = s => btoa(s).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
const unb64url = s => atob(s.replace(/-/g,"+").replace(/_/g,"/"));
async function hmac(secret, value) {
  const k = await crypto.subtle.importKey("raw", enc.encode(secret), {name:"HMAC",hash:"SHA-256"}, false, ["sign"]);
  return hex(await crypto.subtle.sign("HMAC", k, enc.encode(value)));
}
function equal(a,b) {
  if(typeof a!=="string" || typeof b!=="string" || a.length!==b.length) return false;
  let n=0; for(let i=0;i<a.length;i++) n |= a.charCodeAt(i)^b.charCodeAt(i); return n===0;
}
function cors(request,env) {
  const o=request.headers.get("Origin")||"";
  if(o && o===env.ALLOWED_ORIGIN) return {"access-control-allow-origin":o,"access-control-allow-methods":"GET, POST, OPTIONS","access-control-allow-headers":"Content-Type, Authorization, X-Razorpay-Signature","access-control-max-age":"86400","vary":"Origin"};
  return {};
}
function originOk(req,env) { return req.headers.get("Origin")===env.ALLOWED_ORIGIN && !!env.ALLOWED_ORIGIN; }
async function rp(env,path,options={}) {
  const auth=btoa(env.RAZORPAY_KEY_ID+":"+env.RAZORPAY_KEY_SECRET);
  const r=await fetch("https://api.razorpay.com/v1"+path,{...options,headers:{authorization:"Basic "+auth,"content-type":"application/json",...(options.headers||{})}});
  const b=await r.json().catch(()=>({}));
  if(!r.ok) throw new Error(b.error?.description||"Razorpay request failed");
  return b;
}
async function sessionFrom(req,env) {
  const token=(req.headers.get("Authorization")||"").replace(/^Bearer\s+/i,"");
  const p=token.split(".");
  if(p.length!==2) return null;
  const sig=await hmac(env.SESSION_SECRET,p[0]);
  if(!equal(sig,p[1])) return null;
  try { const data=JSON.parse(unb64url(p[0])); if(!data.email||!data.collegeId||data.exp<Date.now()) return null; return data; } catch { return null; }
}
async function startEmailOtp(req,env) {
  if(!originOk(req,env)) return json({error:"Origin not allowed."},403);
  const b=await req.json().catch(()=>null);
  const email=String(b?.email||"").trim().toLowerCase();
  const collegeName=String(b?.collegeName||"").trim();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||!collegeName) return json({error:"Valid email and college are required."},400);
  const college=await env.DB.prepare("SELECT id,name,email_domain FROM colleges WHERE name=? AND active=1").bind(collegeName).first();
  if(!college||email.split("@")[1]!==String(college.email_domain||"").toLowerCase()) return json({error:"Use your registered college email address."},403);
  const now=Date.now();
  const ip=req.headers.get("CF-Connecting-IP")||"unknown";
  const recent=await env.DB.prepare("SELECT COUNT(*) AS n FROM otp_requests WHERE email=? AND created_at>?").bind(email,now-15*60*1000).first();
  const ipRecent=await env.DB.prepare("SELECT COUNT(*) AS n FROM otp_requests WHERE request_ip=? AND created_at>?").bind(ip,now-15*60*1000).first();
  if((recent?.n||0)>=3||(ipRecent?.n||0)>=10) return json({error:"Too many OTP requests. Try again after 15 minutes."},429);
  await env.DB.prepare("INSERT INTO otp_requests(request_id,email,request_ip,created_at) VALUES(?,?,?,?)").bind(crypto.randomUUID(),email,ip,now).run();
  const code=String(crypto.getRandomValues(new Uint32Array(1))[0]%1000000).padStart(6,"0");
  const otpHash=await hmac(env.OTP_SECRET,email+"|"+college.id+"|"+code);
  await env.DB.prepare("DELETE FROM email_otps WHERE email=?").bind(email).run();
  await env.DB.prepare("INSERT INTO email_otps(email,college_id,otp_hash,expires_at,attempts,created_at,request_ip) VALUES(?,?,?,?,0,?,?)").bind(email,college.id,otpHash,now+5*60*1000,now,ip).run();
  const mail=await fetch("https://api.resend.com/emails",{method:"POST",headers:{authorization:"Bearer "+env.RESEND_API_KEY,"content-type":"application/json"},body:JSON.stringify({from:env.MAIL_FROM,to:[email],subject:"Your Campus Bites verification code",html:"<p>Your Campus Bites verification code is <strong>"+code+"</strong>.</p><p>It expires in 5 minutes. Do not share this code.</p>"})});
  if(!mail.ok) { console.error("OTP email provider failed",await mail.text()); return json({error:"Could not send verification email. Please try later."},502); }
  return json({sent:true,expiresInSeconds:300});
}
async function verifyEmailOtp(req,env) {
  if(!originOk(req,env)) return json({error:"Origin not allowed."},403);
  const b=await req.json().catch(()=>null);
  const email=String(b?.email||"").trim().toLowerCase(), collegeName=String(b?.collegeName||"").trim(), code=String(b?.code||"").trim();
  if(!email||!/^\d{6}$/.test(code)||!collegeName) return json({error:"Invalid verification details."},400);
  const college=await env.DB.prepare("SELECT id,name,email_domain FROM colleges WHERE name=? AND active=1").bind(collegeName).first();
  if(!college||email.split("@")[1]!==String(college.email_domain||"").toLowerCase()) return json({error:"College email is not permitted."},403);
  const row=await env.DB.prepare("SELECT * FROM email_otps WHERE email=? AND college_id=?").bind(email,college.id).first();
  if(!row||row.expires_at<Date.now()||row.attempts>=5) return json({error:"Code expired or unavailable. Request a new code."},400);
  const candidate=await hmac(env.OTP_SECRET,email+"|"+college.id+"|"+code);
  if(!equal(candidate,row.otp_hash)) {
    await env.DB.prepare("UPDATE email_otps SET attempts=attempts+1 WHERE email=? AND college_id=?").bind(email,college.id).run();
    return json({error:"Incorrect verification code."},400);
  }
  await env.DB.prepare("DELETE FROM email_otps WHERE email=?").bind(email).run();
  const payload=b64url(JSON.stringify({email:email,collegeId:college.id,collegeName:college.name,exp:Date.now()+8*60*60*1000}));
  return json({verified:true,sessionToken:payload+"."+await hmac(env.SESSION_SECRET,payload),email:email,collegeName:college.name});
}
async function getCatalog(url,env) {
  const college=String(url.searchParams.get("college")||"").trim();
  if(!college) return json({error:"College is required."},400);
  const rows=await env.DB.prepare("SELECT id,name,price_paise,category,college_name,canteen_name,active FROM menu_items WHERE college_name=? AND active=1 ORDER BY name").bind(college).all();
  return json({items:(rows.results||[]).map(x=>({id:x.id,name:x.name,price:x.price_paise/100,category:x.category,college:x.college_name,canteen:x.canteen_name}))});
}
async function importCatalog(req,env) {
  const auth=(req.headers.get("Authorization")||"").replace(/^Bearer\s+/i,"");
  if(!env.CATALOG_ADMIN_TOKEN||!equal(auth,env.CATALOG_ADMIN_TOKEN)) return json({error:"Forbidden."},403);
  const b=await req.json().catch(()=>null);
  if(!b||!Array.isArray(b.colleges)||!Array.isArray(b.items)) return json({error:"Expected colleges and items arrays."},400);
  const batch=[];
  for(const c of b.colleges) {
    const id=String(c.id||"").trim(), name=String(c.name||"").trim(), domain=String(c.email_domain||"").trim().toLowerCase();
    if(!id||!name||!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain)) return json({error:"Each college requires id, name and a valid email_domain."},400);
    batch.push(env.DB.prepare("INSERT INTO colleges(id,name,email_domain,active) VALUES(?,?,?,1) ON CONFLICT(id) DO UPDATE SET name=excluded.name,email_domain=excluded.email_domain,active=1").bind(id,name,domain));
  }
  for(const item of b.items) {
    const id=String(item.id||"").trim(), name=String(item.name||"").trim(), college=String(item.college_name||"").trim(), canteen=String(item.canteen_name||"").trim();
    const price=Number(item.price);
    if(!id||!name||!college||!canteen||!Number.isFinite(price)||price<0.01||price>100000||!Number.isInteger(Math.round(price*100))) return json({error:"Invalid menu item. Required: id, name, college_name, canteen_name and positive price."},400);
    batch.push(env.DB.prepare("INSERT INTO menu_items(id,name,price_paise,category,college_name,canteen_name,active) VALUES(?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,price_paise=excluded.price_paise,category=excluded.category,college_name=excluded.college_name,canteen_name=excluded.canteen_name,active=excluded.active").bind(id,name,Math.round(price*100),String(item.category||"Other"),college,canteen,item.active===false?0:1));
  }
  if(batch.length) await env.DB.batch(batch);
  return json({importedColleges:b.colleges.length,importedItems:b.items.length});
}
async function createOrder(req,env) {
  if(env.MULTI_TENANT_PAYMENTS_ENABLED==="true") return createTenantOrder(req,env,{json,sessionFrom,originOk,rp,hmac,equal});
  if(env.CHECKOUT_ENABLED!=="true") return json({error:"Secure checkout is not enabled until the catalogue and authentication are configured."},503);
  if(!originOk(req,env)) return json({error:"Origin not allowed."},403);
  const session=await sessionFrom(req,env);
  if(!session) return json({error:"Your email session has expired. Verify your college email again."},401);
  const b=await req.json().catch(()=>null);
  if(!b||!Array.isArray(b.items)||b.items.length<1||b.items.length>30||typeof b.orderToken!=="string"||!/^TK-\d{1,8}$/.test(b.orderToken)) return json({error:"Invalid order."},400);
  const recentOrders=await env.DB.prepare("SELECT COUNT(*) AS n FROM payment_orders WHERE student_ref=? AND created_at>?").bind(session.email,Date.now()-60*1000).first();
  if((recentOrders?.n||0)>=5) return json({error:"Too many order attempts. Please wait one minute."},429);
  const ids=[...new Set(b.items.map(x=>String(x.id||"")))];
  if(ids.length!==b.items.length) return json({error:"Duplicate menu items are not allowed."},400);
  const quantities=b.items.map(x=>({id:String(x.id||""),qty:Number(x.qty)}));
  if(quantities.some(x=>!x.id||!Number.isInteger(x.qty)||x.qty<1||x.qty>20)) return json({error:"Invalid item quantity."},400);
  const placeholders=ids.map(()=>"?").join(",");
  const found=await env.DB.prepare("SELECT id,name,price_paise,category,college_name,canteen_name FROM menu_items WHERE active=1 AND college_name=? AND id IN ("+placeholders+")").bind(session.collegeName,...ids).all();
  const byId=new Map((found.results||[]).map(x=>[x.id,x]));
  if(byId.size!==ids.length) return json({error:"One or more menu items are unavailable for this college. Refresh the menu."},409);
  const items=quantities.map(q=>{const m=byId.get(q.id);return {id:m.id,name:m.name,qty:q.qty,price:m.price_paise/100,canteen:m.canteen_name,college:m.college_name};});
  const amountPaise=items.reduce((sum,x)=>sum+byId.get(x.id).price_paise*x.qty,0);
  if(!Number.isSafeInteger(amountPaise)||amountPaise<100||amountPaise>10000000) return json({error:"Order total is outside the permitted range."},400);
  const appOrderId=crypto.randomUUID();
  const created=await rp(env,"/orders",{method:"POST",body:JSON.stringify({amount:amountPaise,currency:"INR",receipt:"cb_"+appOrderId.replace(/-/g,"").slice(0,20),notes:{campus_bites_order_id:appOrderId,campus_bites_token:b.orderToken,college:session.collegeName}})});
  await env.DB.prepare("INSERT INTO payment_orders(app_order_id,order_token,razorpay_order_id,amount_paise,currency,status,items_json,student_ref,college_name,created_at) VALUES(?,?,?,?,'INR','created',?,?,?,?)").bind(appOrderId,b.orderToken,created.id,amountPaise,JSON.stringify(items),session.email,session.collegeName,Date.now()).run();
  return json({appOrderId,razorpayOrderId:created.id,amount:created.amount,currency:created.currency,keyId:env.RAZORPAY_KEY_ID,items:items,total:amountPaise/100,customerEmail:session.email},201);
}
async function verifyCheckout(req,env) {
  if(env.MULTI_TENANT_PAYMENTS_ENABLED==="true") return verifyTenantCheckout(req,env,{json,sessionFrom,originOk,rp,hmac,equal});
  if(!originOk(req,env)) return json({error:"Origin not allowed."},403);
  const session=await sessionFrom(req,env);
  if(!session) return json({error:"Email session expired."},401);
  const b=await req.json().catch(()=>null);
  if(!b?.razorpay_order_id||!b?.razorpay_payment_id||!b?.razorpay_signature) return json({error:"Missing payment verification fields."},400);
  const record=await env.DB.prepare("SELECT * FROM payment_orders WHERE razorpay_order_id=? AND student_ref=?").bind(b.razorpay_order_id,session.email).first();
  if(!record) return json({error:"Payment order not found for this verified email."},404);
  if(record.status==="refunded") return json({error:"This order has already been refunded."},409);
  const expected=await hmac(env.RAZORPAY_KEY_SECRET,record.razorpay_order_id+"|"+b.razorpay_payment_id);
  if(!equal(expected,b.razorpay_signature)) return json({error:"Payment signature verification failed."},400);
  const payment=await rp(env,"/payments/"+encodeURIComponent(b.razorpay_payment_id));
  if(payment.order_id!==record.razorpay_order_id||payment.amount!==record.amount_paise||payment.currency!=="INR") return json({error:"Payment does not match the Campus Bites order."},409);
  if(payment.status!=="captured") return json({error:"Payment has not been captured yet.",status:payment.status},409);
  await env.DB.prepare("UPDATE payment_orders SET status='paid',razorpay_payment_id=?,paid_at=COALESCE(paid_at,?) WHERE app_order_id=? AND status!='refunded'").bind(payment.id,Date.now(),record.app_order_id).run();
  const confirmed=await env.DB.prepare("SELECT status FROM payment_orders WHERE app_order_id=?").bind(record.app_order_id).first();
  if(confirmed?.status!=="paid") return json({error:"Payment status changed while verification was running. Contact the canteen administrator before retrying."},409);
  return json({verified:true,appOrderId:record.app_order_id,paymentId:payment.id,status:"paid"});
}
async function webhook(req,env) {
  const raw=await req.text(), sig=req.headers.get("X-Razorpay-Signature")||"";
  if(!equal(await hmac(env.RAZORPAY_WEBHOOK_SECRET,raw),sig)) return json({error:"Invalid webhook signature."},400);
  const eventId=req.headers.get("x-razorpay-event-id")||"";
  if(!eventId) return json({error:"Missing webhook event id."},400);
  let event;
  try { event=JSON.parse(raw); } catch { return json({error:"Invalid webhook payload."},400); }

  // Record every event once. Razorpay retries webhook deliveries; duplicate IDs are safe no-ops.
  const inserted=await env.DB.prepare("INSERT OR IGNORE INTO razorpay_webhook_events(event_id,received_at) VALUES(?,?)").bind(eventId,Date.now()).run();
  if(!inserted.meta?.changes) return json({received:true,duplicate:true});

  const payment=event.payload?.payment?.entity;
  if(payment&&(event.event==="payment.captured"||event.event==="order.paid")) {
    const row=await env.DB.prepare("SELECT * FROM payment_orders WHERE razorpay_order_id=?").bind(payment.order_id).first();
    if(row&&payment.amount===row.amount_paise&&payment.currency==="INR"&&payment.status==="captured") {
      await env.DB.prepare("UPDATE payment_orders SET status='paid',razorpay_payment_id=?,paid_at=COALESCE(paid_at,?) WHERE app_order_id=? AND status!='refunded'").bind(payment.id,Date.now(),row.app_order_id).run();
    }
  } else if(payment&&event.event==="payment.failed") {
    // A failed attempt must never downgrade an order that has already been captured.
    await env.DB.prepare("UPDATE payment_orders SET status='failed' WHERE razorpay_order_id=? AND status='created'").bind(payment.order_id).run();
  } else if(event.event==="refund.processed") {
    const refund=event.payload?.refund?.entity;
    if(refund?.payment_id&&Number.isSafeInteger(refund.amount)) {
      const row=await env.DB.prepare("SELECT app_order_id,amount_paise FROM payment_orders WHERE razorpay_payment_id=?").bind(refund.payment_id).first();
      // Only mark the whole order refunded for a full refund; partial refunds need a separate ledger state.
      if(row&&refund.amount>=row.amount_paise) {
        await env.DB.prepare("UPDATE payment_orders SET status='refunded' WHERE app_order_id=? AND status='paid'").bind(row.app_order_id).run();
      }
    }
  }
  await reconcileTenantWebhook(event,env);
  return json({received:true});
}
export default { async fetch(req,env) {
  const ch=cors(req,env), url=new URL(req.url);
  if(req.method==="OPTIONS") return new Response(null,{status:204,headers:ch});
  try {
    let r;
    if(url.pathname.startsWith("/api/college-admin/") || url.pathname.startsWith("/api/platform/")) {
      const handled=await handleMultiCollegeRoute(req,env,url,{json,sessionFrom,originOk,rp,hmac,equal});
      r=handled || json({error:"Not found."},404,ch);
    }
    else if(req.method==="GET"&&url.pathname==="/health") r=json({ok:true,service:"campus-bites-payments"},200,ch);
    else if(req.method==="GET"&&url.pathname==="/api/catalog") r=await getCatalog(url,env);
    else if(req.method==="POST"&&url.pathname==="/api/auth/email/start") r=await startEmailOtp(req,env);
    else if(req.method==="POST"&&url.pathname==="/api/auth/email/verify") r=await verifyEmailOtp(req,env);
    else if(req.method==="POST"&&url.pathname==="/api/catalog/import") r=await importCatalog(req,env);
    else if(req.method==="POST"&&url.pathname==="/api/orders") r=await createOrder(req,env);
    else if(req.method==="POST"&&url.pathname==="/api/payments/verify") r=await verifyCheckout(req,env);
    else if(req.method==="POST"&&url.pathname==="/api/webhooks/razorpay") return await webhook(req,env);
    else r=json({error:"Not found."},404,ch);
    return new Response(r.body,{status:r.status,headers:{...Object.fromEntries(r.headers),...ch}});
  } catch(e) { console.error("Campus Bites API error:",e); return json({error:"Payment service temporarily unavailable."},500,ch); }
}};

const fail = (message, status=400) => Response.json({error:message},{status});
const ok = (data, status=200) => Response.json(data,{status});
const now = () => Date.now();
const id = () => crypto.randomUUID();
const clean = (v,max=200) => String(v ?? "").trim().slice(0,max);

async function rpRoute(env,path,options={}) {
  if(!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) throw new Error("Razorpay credentials are not configured.");
  const auth=btoa(env.RAZORPAY_KEY_ID+":"+env.RAZORPAY_KEY_SECRET);
  const response=await fetch("https://api.razorpay.com"+path,{
    ...options,
    headers:{authorization:"Basic "+auth,"content-type":"application/json",...(options.headers||{})}
  });
  const body=await response.json().catch(()=>({}));
  if(!response.ok) throw new Error(body.error?.description || "Razorpay Route request failed.");
  return body;
}

async function collegeAdmin(req,env,session) {
  if(!session) return null;
  return await env.DB.prepare(
    "SELECT role FROM cb_college_admins WHERE college_id=? AND lower(email)=lower(?) AND active=1"
  ).bind(session.collegeId,session.email).first();
}
async function audit(env,collegeId,email,action,entityId,details={}) {
  await env.DB.prepare(
    "INSERT INTO cb_payment_audit(id,college_id,actor_email,action,entity_id,details_json,created_at) VALUES(?,?,?,?,?,?,?)"
  ).bind(id(),collegeId,email,action,entityId||null,JSON.stringify(details),now()).run();
}
function platformAuthorized(req,env) {
  const token=(req.headers.get("Authorization")||"").replace(/^Bearer\\s+/i,"");
  return !!env.PLATFORM_ADMIN_TOKEN && token.length===env.PLATFORM_ADMIN_TOKEN.length &&
    token===env.PLATFORM_ADMIN_TOKEN;
}
function safeConnection(row) {
  return {
    id:row.id, provider:row.provider, displayName:row.display_name,
    status:row.status, verificationStatus:row.verification_status,
    maskedAccount:row.masked_account, createdAt:row.created_at
  };
}

export async function handleMultiCollegeRoute(req,env,url,utils) {
  const path=url.pathname, method=req.method;

  // Platform-only provisioning. Never expose PLATFORM_ADMIN_TOKEN to browser code.
  if(path==="/api/platform/colleges" && method==="POST") {
    if(!platformAuthorized(req,env)) return fail("Platform administrator authorization required.",403);
    const b=await req.json().catch(()=>null);
    const collegeId=clean(b?.id,80), name=clean(b?.name,180);
    const domain=clean(b?.email_domain,120).toLowerCase();
    const adminEmail=clean(b?.owner_email,180).toLowerCase();
    if(!collegeId || !name || !/^[a-z0-9.-]+\\.[a-z]{2,}$/i.test(domain) ||
       !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(adminEmail) ||
       adminEmail.split("@")[1]!==domain) return fail("Provide college id, name, valid institutional email domain and an owner email on that domain.");
    await env.DB.prepare(
      "INSERT INTO colleges(id,name,email_domain,active) VALUES(?,?,?,1) ON CONFLICT(id) DO UPDATE SET name=excluded.name,email_domain=excluded.email_domain,active=1"
    ).bind(collegeId,name,domain).run();
    await env.DB.prepare(
      "INSERT INTO cb_college_admins(id,college_id,email,role,active,created_at) VALUES(?,?,?,'OWNER',1,?) ON CONFLICT(college_id,email) DO UPDATE SET active=1,role='OWNER'"
    ).bind(id(),collegeId,adminEmail,now()).run();
    return ok({created:true,collegeId,name,ownerEmail:adminEmail},201);
  }

  if(path==="/api/platform/college-admins" && method==="POST") {
    if(!platformAuthorized(req,env)) return fail("Platform administrator authorization required.",403);
    const b=await req.json().catch(()=>null);
    const collegeId=clean(b?.collegeId,80), email=clean(b?.email,180).toLowerCase();
    const role=clean(b?.role,20).toUpperCase();
    const college=await env.DB.prepare("SELECT id,email_domain FROM colleges WHERE id=? AND active=1").bind(collegeId).first();
    if(!college || !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email) ||
       email.split("@")[1]!==String(college.email_domain).toLowerCase() ||
       !["ADMIN","FINANCE","OWNER"].includes(role)) return fail("Invalid college administrator details.");
    await env.DB.prepare(
      "INSERT INTO cb_college_admins(id,college_id,email,role,active,created_at) VALUES(?,?,?,?,1,?) ON CONFLICT(college_id,email) DO UPDATE SET role=excluded.role,active=1"
    ).bind(id(),collegeId,email,role,now()).run();
    return ok({added:true,collegeId,email,role},201);
  }

  const session=await utils.sessionFrom(req,env);
  if(path.startsWith("/api/college-admin/")) {
    if(!utils.originOk(req,env)) return fail("Origin not allowed.",403);
    if(!session) return fail("Your verified college email session has expired.",401);
    const member=await collegeAdmin(req,env,session);
    if(!member) return fail("College administrator permission required.",403);
    const collegeId=session.collegeId;

    if(path==="/api/college-admin/config" && method==="GET") {
      const settings=await env.DB.prepare("SELECT * FROM cb_payment_settings WHERE college_id=?").bind(collegeId).first();
      const connections=await env.DB.prepare("SELECT * FROM cb_merchant_connections WHERE college_id=? ORDER BY created_at DESC").bind(collegeId).all();
      const destinations=await env.DB.prepare("SELECT * FROM cb_payment_destinations WHERE college_id=? ORDER BY created_at DESC").bind(collegeId).all();
      return ok({
        college:{id:session.collegeId,name:session.collegeName,email:session.email,role:member.role},
        settings:settings||{destination_mode:"CENTRAL",integration_mode:"RAZORPAY_ROUTE"},
        connections:(connections.results||[]).map(safeConnection),
        destinations:destinations.results||[]
      });
    }

    if(path==="/api/college-admin/settings" && method==="PUT") {
      const b=await req.json().catch(()=>null);
      const mode=clean(b?.destinationMode,20).toUpperCase();
      const integration=clean(b?.integrationMode,30).toUpperCase();
      if(!["CENTRAL","CANTEEN"].includes(mode) ||
         !["RAZORPAY_ROUTE","DIRECT_BANK","HYBRID"].includes(integration)) return fail("Invalid payment configuration.");
      const count=mode==="CENTRAL"
        ? await env.DB.prepare("SELECT COUNT(*) AS n FROM cb_payment_destinations d JOIN cb_merchant_connections m ON m.id=d.merchant_connection_id WHERE d.college_id=? AND d.destination_type='CENTRAL' AND d.status='ACTIVE' AND m.status='ACTIVE'").bind(collegeId).first()
        : await env.DB.prepare("SELECT COUNT(*) AS n FROM cb_payment_destinations d JOIN cb_merchant_connections m ON m.id=d.merchant_connection_id WHERE d.college_id=? AND d.destination_type='CANTEEN' AND d.status='ACTIVE' AND m.status='ACTIVE'").bind(collegeId).first();
      if(!(count?.n>0)) return fail("At least one verified destination is required before enabling this mode.",409);
      await env.DB.prepare(
        "INSERT INTO cb_payment_settings(college_id,destination_mode,integration_mode,updated_by,updated_at) VALUES(?,?,?,?,?) ON CONFLICT(college_id) DO UPDATE SET destination_mode=excluded.destination_mode,integration_mode=excluded.integration_mode,updated_by=excluded.updated_by,updated_at=excluded.updated_at"
      ).bind(collegeId,mode,integration,session.email,now()).run();
      await audit(env,collegeId,session.email,"PAYMENT_SETTINGS_UPDATED",collegeId,{destinationMode:mode,integrationMode:integration});
      return ok({updated:true,destinationMode:mode,integrationMode:integration});
    }

    if(path==="/api/college-admin/route/onboard" && method==="POST") {
      if(env.ROUTE_ENABLED!=="true") return fail("Razorpay Route onboarding is disabled. Obtain Route approval and enable ROUTE_ENABLED first.",503);
      const b=await req.json().catch(()=>null);
      const type=clean(b?.destinationType,20).toUpperCase();
      const canteenName=clean(b?.canteenName,100);
      if(!b || !["CENTRAL","CANTEEN"].includes(type) ||
         (type==="CANTEEN"&&!canteenName) || (type==="CENTRAL"&&canteenName)) return fail("Choose a valid central or canteen destination.");
      if(b.tncAccepted!==true) return fail("The authorised representative must accept Razorpay's linked-account terms.");
      const legalName=clean(b.legalBusinessName,200), businessType=clean(b.businessType,40);
      const email=clean(b.businessEmail,180).toLowerCase(), phone=clean(b.phone,20);
      const pan=clean(b.pan,10).toUpperCase(), beneficiary=clean(b.beneficiaryName,120);
      const account=clean(b.accountNumber,24), ifsc=clean(b.ifsc,11).toUpperCase();
      if(legalName.length<4 || !businessType || !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email) ||
         !/^\\+?[0-9]{10,15}$/.test(phone) || !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan) ||
         beneficiary.length<2 || !/^[0-9]{9,18}$/.test(account) ||
         !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) return fail("Check the legal name, business type, email, phone, PAN, beneficiary, account number and IFSC.");
      const existing=type==="CENTRAL"
        ? await env.DB.prepare("SELECT id FROM cb_payment_destinations WHERE college_id=? AND destination_type='CENTRAL'").bind(collegeId).first()
        : await env.DB.prepare("SELECT id FROM cb_payment_destinations WHERE college_id=? AND destination_type='CANTEEN' AND canteen_name=?").bind(collegeId,canteenName).first();
      if(existing) return fail("A destination already exists for this account type. Contact CampusBites support to replace it safely.",409);

      // Bank/PAN details are sent directly to Razorpay and are deliberately not persisted in CampusBites.
      const connectionId=id();
      const referenceId=("CB"+connectionId.replace(/-/g,"")).slice(0,20);
      const routeBody={
        type:"route",tnc_accepted:true,reference_id:referenceId,
        legal_business_name:legalName,business_type:businessType,email,phone,
        legal_info:{pan},
        notes:{campus_bites_college_id:collegeId,campus_bites_destination:type==="CENTRAL"?"CENTRAL":canteenName},
        settlement_accounts:[{
          method:"bank_account",
          bank_account:{account_number:account,beneficiary_name:beneficiary,code_type:"ifsc",code:ifsc,currency:"INR",is_default:true}
        }]
      };
      const linked=await rpRoute(env,"/v2/accounts",{method:"POST",headers:{"Idempotency-Key":connectionId},body:JSON.stringify(routeBody)});
      const settlement=linked.product_config?.active_configuration?.settlement_accounts?.[0];
      const verified=linked.product_config?.activation_status==="activated" &&
        settlement?.verification_status==="verified" && settlement?.active===true;
      const masked="••••"+account.slice(-4);
      await env.DB.prepare(
        "INSERT INTO cb_merchant_connections(id,college_id,provider,external_merchant_id,provider_reference,display_name,status,verification_status,masked_account,metadata_json,created_by,created_at,updated_at) VALUES(?,?,'RAZORPAY_ROUTE',?,?,?,?,?,?,?,?,?,?)"
      ).bind(connectionId,collegeId,linked.id,referenceId,legalName,verified?"ACTIVE":"PENDING",settlement?.verification_status||linked.product_config?.activation_status||"PENDING",masked,JSON.stringify({productConfigId:linked.product_config?.id||null}),session.email,now(),now()).run();
      const destinationId=id();
      await env.DB.prepare(
        "INSERT INTO cb_payment_destinations(id,college_id,destination_type,canteen_name,merchant_connection_id,display_name,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)"
      ).bind(destinationId,collegeId,type,type==="CANTEEN"?canteenName:null,connectionId,legalName,verified?"ACTIVE":"PENDING",now(),now()).run();
      await env.DB.prepare("INSERT OR IGNORE INTO cb_payment_settings(college_id,destination_mode,integration_mode,updated_by,updated_at) VALUES(?,?, 'RAZORPAY_ROUTE',?,?)").bind(collegeId,type,session.email,now()).run();
      await audit(env,collegeId,session.email,"ROUTE_MERCHANT_ONBOARDED",connectionId,{destinationType:type,canteenName:type==="CANTEEN"?canteenName:null,linkedAccountId:linked.id});
      return ok({created:true,connectionId,destinationId,linkedAccountId:linked.id,status:verified?"ACTIVE":"PENDING",verificationStatus:settlement?.verification_status||"PENDING",maskedAccount:masked},201);
    }

    if(path==="/api/college-admin/route/refresh" && method==="POST") {
      if(env.ROUTE_ENABLED!=="true") return fail("Razorpay Route is disabled.",503);
      const b=await req.json().catch(()=>null), connectionId=clean(b?.connectionId,80);
      const row=await env.DB.prepare("SELECT * FROM cb_merchant_connections WHERE id=? AND college_id=? AND provider='RAZORPAY_ROUTE'").bind(connectionId,collegeId).first();
      if(!row) return fail("Merchant connection not found.",404);
      const linked=await rpRoute(env,"/v2/accounts/"+encodeURIComponent(row.external_merchant_id));
      const settlement=linked.product_config?.active_configuration?.settlement_accounts?.[0];
      const verified=linked.product_config?.activation_status==="activated" && settlement?.verification_status==="verified" && settlement?.active===true;
      const status=verified?"ACTIVE":"PENDING";
      await env.DB.prepare("UPDATE cb_merchant_connections SET status=?,verification_status=?,updated_at=? WHERE id=? AND college_id=?").bind(status,settlement?.verification_status||linked.product_config?.activation_status||"PENDING",now(),connectionId,collegeId).run();
      await env.DB.prepare("UPDATE cb_payment_destinations SET status=?,updated_at=? WHERE merchant_connection_id=? AND college_id=?").bind(status,now(),connectionId,collegeId).run();
      await audit(env,collegeId,session.email,"ROUTE_MERCHANT_REFRESHED",connectionId,{status,verificationStatus:settlement?.verification_status||"PENDING"});
      return ok({connectionId,status,verificationStatus:settlement?.verification_status||"PENDING"});
    }

    if(path==="/api/college-admin/direct-bank/request" && method==="POST") {
      const b=await req.json().catch(()=>null);
      const bankName=clean(b?.bankName,100), merchantRef=clean(b?.merchantReference,120);
      const type=clean(b?.destinationType,20).toUpperCase();
      const canteenName=clean(b?.canteenName,100);
      if(!bankName || !merchantRef || !["CENTRAL","CANTEEN"].includes(type) ||
         (type==="CANTEEN"&&!canteenName) || (type==="CENTRAL"&&canteenName))
        return fail("Bank name, bank-issued merchant reference and valid destination details are required.");
      const existing=type==="CENTRAL"
        ? await env.DB.prepare("SELECT id FROM cb_payment_destinations WHERE college_id=? AND destination_type='CENTRAL'").bind(collegeId).first()
        : await env.DB.prepare("SELECT id FROM cb_payment_destinations WHERE college_id=? AND destination_type='CANTEEN' AND canteen_name=?").bind(collegeId,canteenName).first();
      if(existing) return fail("A destination already exists for this account type.",409);
      const connectionId=id(), destinationId=id();
      await env.DB.prepare(
        "INSERT INTO cb_merchant_connections(id,college_id,provider,external_merchant_id,provider_reference,display_name,status,verification_status,metadata_json,created_by,created_at,updated_at) VALUES(?,?,'DIRECT_BANK',NULL,?,?,'PENDING','PENDING',?,?,?,?)"
      ).bind(connectionId,collegeId,merchantRef,bankName,JSON.stringify({bankName}),session.email,now(),now()).run();
      await env.DB.prepare(
        "INSERT INTO cb_payment_destinations(id,college_id,destination_type,canteen_name,merchant_connection_id,display_name,status,created_at,updated_at) VALUES(?,?,?,?,?,?, 'PENDING',?,?)"
      ).bind(destinationId,collegeId,type,type==="CANTEEN"?canteenName:null,connectionId,bankName,now(),now()).run();
      await audit(env,collegeId,session.email,"DIRECT_BANK_CONNECTION_REQUESTED",connectionId,{bankName,destinationType:type,canteenName});
      return ok({created:true,connectionId,destinationId,status:"PENDING",message:"Bank merchant integration is awaiting CampusBites technical verification. Payments remain disabled until a bank-specific adapter is installed and tested."},201);
    }

    return fail("Not found.",404);
  }
  return null;
}

export async function createTenantOrder(req,env,utils) {
  if(env.CHECKOUT_ENABLED!=="true" || env.MULTI_TENANT_PAYMENTS_ENABLED!=="true")
    return utils.json({error:"Multi-college checkout is not enabled."},503);
  if(!utils.originOk(req,env)) return utils.json({error:"Origin not allowed."},403);
  const session=await utils.sessionFrom(req,env);
  if(!session) return utils.json({error:"Your email session has expired. Verify your college email again."},401);
  const b=await req.json().catch(()=>null);
  if(!b || !Array.isArray(b.items) || b.items.length<1 || b.items.length>30 ||
     typeof b.orderToken!=="string" || !/^TK-\\d{1,8}$/.test(b.orderToken)) return utils.json({error:"Invalid order."},400);
  const ids=b.items.map(x=>clean(x?.id,100));
  if(ids.some(x=>!x) || new Set(ids).size!==ids.length) return utils.json({error:"Invalid or duplicate menu item."},400);
  const quantities=b.items.map(x=>({id:clean(x.id,100),qty:Number(x.qty)}));
  if(quantities.some(x=>!Number.isInteger(x.qty)||x.qty<1||x.qty>20)) return utils.json({error:"Invalid quantity."},400);
  const recent=await env.DB.prepare("SELECT COUNT(*) AS n FROM cb_multi_payment_orders WHERE student_ref=? AND created_at>?").bind(session.email,now()-60000).first();
  if((recent?.n||0)>=5) return utils.json({error:"Too many payment attempts. Try again in one minute."},429);
  const placeholders=ids.map(()=>"?").join(",");
  const found=await env.DB.prepare("SELECT id,name,price_paise,category,college_name,canteen_name FROM menu_items WHERE active=1 AND college_name=? AND id IN ("+placeholders+")").bind(session.collegeName,...ids).all();
  const byId=new Map((found.results||[]).map(x=>[x.id,x]));
  if(byId.size!==ids.length) return utils.json({error:"One or more menu items are unavailable for this college."},409);
  const items=quantities.map(q=>{const m=byId.get(q.id);return {id:m.id,name:m.name,qty:q.qty,price:m.price_paise/100,canteen:m.canteen_name,college:m.college_name};});
  const canteens=[...new Set(items.map(x=>x.canteen))];
  const amountPaise=items.reduce((sum,x)=>sum+byId.get(x.id).price_paise*x.qty,0);
  if(!Number.isSafeInteger(amountPaise)||amountPaise<100||amountPaise>10000000) return utils.json({error:"Order total is outside the permitted range."},400);
  const settings=await env.DB.prepare("SELECT * FROM cb_payment_settings WHERE college_id=?").bind(session.collegeId).first();
  if(!settings) return utils.json({error:"This college has not configured an approved payment destination yet."},503);

  // Resolve destinations entirely on the server. Central mode produces one transfer;
  // individual mode produces one transfer per canteen represented in this order.
  const destinationGroups=[];
  if(settings.destination_mode==="CENTRAL") {
    const destination=await env.DB.prepare("SELECT * FROM cb_payment_destinations WHERE college_id=? AND destination_type='CENTRAL' AND status='ACTIVE'").bind(session.collegeId).first();
    if(!destination) return utils.json({error:"No verified central payment account is configured."},503);
    const connection=await env.DB.prepare("SELECT * FROM cb_merchant_connections WHERE id=? AND college_id=? AND status='ACTIVE'").bind(destination.merchant_connection_id,session.collegeId).first();
    if(!connection || connection.provider!=="RAZORPAY_ROUTE") return utils.json({error:"The central destination does not have an active Razorpay Route connection."},503);
    destinationGroups.push({destination,connection,amountPaise,canteens});
  } else {
    for(const canteenName of canteens) {
      const destination=await env.DB.prepare("SELECT * FROM cb_payment_destinations WHERE college_id=? AND destination_type='CANTEEN' AND canteen_name=? AND status='ACTIVE'").bind(session.collegeId,canteenName).first();
      if(!destination) return utils.json({error:"No verified payment account is configured for canteen: "+canteenName},503);
      const connection=await env.DB.prepare("SELECT * FROM cb_merchant_connections WHERE id=? AND college_id=? AND status='ACTIVE'").bind(destination.merchant_connection_id,session.collegeId).first();
      if(!connection || connection.provider!=="RAZORPAY_ROUTE") return utils.json({error:"The merchant account for "+canteenName+" is not an active Razorpay Route account."},503);
      const canteenAmount=items.filter(x=>x.canteen===canteenName).reduce((sum,x)=>sum+byId.get(x.id).price_paise*x.qty,0);
      destinationGroups.push({destination,connection,amountPaise:canteenAmount,canteens:[canteenName]});
    }
  }
  if(env.ROUTE_ENABLED!=="true") return utils.json({error:"Razorpay Route is not enabled for this merchant."},503);
  const appOrderId=crypto.randomUUID();
  const transfers=destinationGroups.map(group=>({
    account:group.connection.external_merchant_id,
    amount:group.amountPaise,
    currency:"INR",
    notes:{college_id:session.collegeId,canteen:group.canteens.join(","),order_id:appOrderId},
    linked_account_notes:["college_id","canteen","order_id"],
    on_hold:false
  }));
  if(transfers.reduce((sum,t)=>sum+t.amount,0)!==amountPaise) return utils.json({error:"Payment destination allocation does not match order total."},409);
  const primary=destinationGroups[0];
  const created=await utils.rp(env,"/orders",{method:"POST",body:JSON.stringify({
    amount:amountPaise,currency:"INR",receipt:"cb_"+appOrderId.replace(/-/g,"").slice(0,20),
    payment_capture:1,partial_payment:false,transfers,
    notes:{campus_bites_order_id:appOrderId,campus_bites_token:b.orderToken,college:session.collegeName,canteens:canteens.join(",")}
  })});
  const destinationMap=destinationGroups.map(g=>({destinationId:g.destination.id,merchantConnectionId:g.connection.id,canteens:g.canteens,amountPaise:g.amountPaise}));
  await env.DB.prepare(
    "INSERT INTO cb_multi_payment_orders(app_order_id,order_token,razorpay_order_id,college_id,college_name,canteen_name,destination_id,merchant_connection_id,destination_map_json,amount_paise,currency,status,transfer_status,items_json,student_ref,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,'INR','created','created',?,?,?)"
  ).bind(appOrderId,b.orderToken,created.id,session.collegeId,session.collegeName,canteens.length===1?canteens[0]:"MULTIPLE",primary.destination.id,primary.connection.id,JSON.stringify(destinationMap),amountPaise,JSON.stringify(items),session.email,now()).run();
  return utils.json({appOrderId,razorpayOrderId:created.id,amount:created.amount,currency:created.currency,keyId:env.RAZORPAY_KEY_ID,items,total:amountPaise/100,customerEmail:session.email,provider:"RAZORPAY_ROUTE"},201);
}

export async function verifyTenantCheckout(req,env,utils) {
  if(!utils.originOk(req,env)) return utils.json({error:"Origin not allowed."},403);
  const session=await utils.sessionFrom(req,env);
  if(!session) return utils.json({error:"Email session expired."},401);
  const b=await req.json().catch(()=>null);
  if(!b?.razorpay_order_id || !b?.razorpay_payment_id || !b?.razorpay_signature) return utils.json({error:"Missing payment verification fields."},400);
  const row=await env.DB.prepare("SELECT * FROM cb_multi_payment_orders WHERE razorpay_order_id=? AND student_ref=? AND college_id=?").bind(b.razorpay_order_id,session.email,session.collegeId).first();
  if(!row) return utils.json({error:"Payment order not found."},404);
  if(row.status==="refunded") return utils.json({error:"This order has been refunded."},409);
  const expected=await utils.hmac(env.RAZORPAY_KEY_SECRET,row.razorpay_order_id+"|"+b.razorpay_payment_id);
  if(!utils.equal(expected,b.razorpay_signature)) return utils.json({error:"Payment signature verification failed."},400);
  const payment=await utils.rp(env,"/payments/"+encodeURIComponent(b.razorpay_payment_id));
  if(payment.order_id!==row.razorpay_order_id || payment.amount!==row.amount_paise || payment.currency!=="INR") return utils.json({error:"Payment does not match this order."},409);
  if(payment.status!=="captured") return utils.json({error:"Payment has not been captured yet.",status:payment.status},409);
  await env.DB.prepare("UPDATE cb_multi_payment_orders SET status='paid',razorpay_payment_id=?,paid_at=COALESCE(paid_at,?) WHERE app_order_id=? AND status!='refunded'").bind(payment.id,now(),row.app_order_id).run();
  const updated=await env.DB.prepare("SELECT status,transfer_status FROM cb_multi_payment_orders WHERE app_order_id=?").bind(row.app_order_id).first();
  if(updated?.status!=="paid") return utils.json({error:"Payment captured but order status needs reconciliation. Do not pay again."},409);
  return utils.json({verified:true,appOrderId:row.app_order_id,paymentId:payment.id,status:"paid",transferStatus:updated.transfer_status});
}

export async function reconcileTenantWebhook(event,env) {
  const payment=event.payload?.payment?.entity;
  if(payment && (event.event==="payment.captured" || event.event==="order.paid")) {
    const row=await env.DB.prepare("SELECT * FROM cb_multi_payment_orders WHERE razorpay_order_id=?").bind(payment.order_id).first();
    if(row && payment.amount===row.amount_paise && payment.currency==="INR" && payment.status==="captured") {
      await env.DB.prepare("UPDATE cb_multi_payment_orders SET status='paid',razorpay_payment_id=?,paid_at=COALESCE(paid_at,?) WHERE app_order_id=? AND status!='refunded'").bind(payment.id,now(),row.app_order_id).run();
    }
  }
  if(event.event==="transfer.processed" || event.event==="transfer.failed" || event.event==="transfer.reversed") {
    const transfer=event.payload?.transfer?.entity;
    const orderId=transfer?.notes?.order_id;
    if(orderId) {
      const state=event.event==="transfer.processed"?"processed":event.event==="transfer.failed"?"failed":"reversed";
      await env.DB.prepare("UPDATE cb_multi_payment_orders SET transfer_status=?,transfer_ids_json=? WHERE app_order_id=?").bind(state,JSON.stringify([transfer.id]),orderId).run();
    }
  }
}

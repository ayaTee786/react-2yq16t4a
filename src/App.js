import React,{useState,useEffect,useRef,useCallback}from"react";

const SB_URL="https://lhyfgafhpqifejkxzerw.supabase.co";
const SB_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxoeWZnYWZocHFpZmVqa3h6ZXJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3Mjk4ODQsImV4cCI6MjA5NTMwNTg4NH0.s5leLiUEljL6KPStR74WT1mG_vMvJ09f56F-jtGWmGg";

// ── Supabase API ─────────────────────────────────────────────
function sbApi(url,key){
  const h=tok=>({"apikey":key,"Content-Type":"application/json",...(tok?{"Authorization":`Bearer ${tok}`}:{})});
  return{
    signUp:(e,p)=>fetch(`${url}/auth/v1/signup`,{method:"POST",headers:h(),body:JSON.stringify({email:e,password:p})}).then(r=>r.json()),
    signIn:(e,p)=>fetch(`${url}/auth/v1/token?grant_type=password`,{method:"POST",headers:h(),body:JSON.stringify({email:e,password:p})}).then(r=>r.json()),
    signOut:tok=>fetch(`${url}/auth/v1/logout`,{method:"POST",headers:h(tok)}),
    list:(table,tok)=>fetch(`${url}/rest/v1/${table}?select=*&order=id.desc`,{headers:h(tok)}).then(r=>r.json()),
    insert:(table,rec,tok)=>fetch(`${url}/rest/v1/${table}`,{method:"POST",headers:{...h(tok),"Prefer":"return=representation"},body:JSON.stringify(rec)}).then(async r=>{const j=await r.json().catch(()=>null);if(!r.ok)throw new Error(j?.message||j?.details||`Insert failed: ${r.status}`);return j;}),
    update:(table,id,rec,tok)=>fetch(`${url}/rest/v1/${table}?id=eq.${id}`,{method:"PATCH",headers:{...h(tok),"Prefer":"return=representation"},body:JSON.stringify(rec)}).then(async r=>{const j=await r.json().catch(()=>null);if(!r.ok)throw new Error(j?.message||j?.details||`Update failed: ${r.status}`);return j;}),
    remove:(table,ids,tok)=>{
      const list=(Array.isArray(ids)?ids:[ids]).filter(v=>v!==null&&v!==undefined&&String(v).trim()!=="").map(v=>String(v).trim());
      if(!list.length)return Promise.resolve([]);
      const q=list.length===1?`id=eq.${encodeURIComponent(list[0])}`:`id=in.(${list.map(v=>encodeURIComponent(v)).join(",")})`;
      return fetch(`${url}/rest/v1/${table}?${q}`,{method:"DELETE",headers:{...h(tok),"Prefer":"return=representation"}})
        .then(async r=>{const j=await r.json().catch(()=>null);if(!r.ok)throw new Error(j?.message||j?.details||`Delete failed: ${r.status}`);return j||[];});
    },
    recover:email=>fetch(`${url}/auth/v1/recover`,{method:"POST",headers:h(),body:JSON.stringify({email})}).then(r=>r.json()),
    count:(table,tok)=>fetch(`${url}/rest/v1/${table}?select=id`,{method:"GET",
      headers:{...h(tok),"Prefer":"count=exact","Range":"0-0"}})
      .then(r=>{const cr=r.headers.get("content-range");
        return cr?parseInt(cr.split("/")[1]||"0"):0;}).catch(()=>0),
  };
}

// ── Theme ────────────────────────────────────────────────────
const APP_LOGO_DATA_URI=`data:image/png;base64,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`;
const C={
  // Main area — clean white
  bg:"#F9F9F7",card:"#FFFFFF",card2:"#F4F4F2",
  border:"#E8E8E6",borderL:"#D8D8D5",
  accent:"#F0B429",accentH:"#F5C842",accentD:"rgba(240,180,41,0.12)",
  text:"#111110",sub:"#6B6B6B",dim:"#AAAAAA",ok:"#16A34A",
  // Sidebar — dark premium
  sb:"#141414",sbCard:"#1E1E1E",sbBorder:"#2A2A2A",
  sbText:"#F0EDE8",sbSub:"#888880",sbDim:"#555550",
  inp:{background:"#FFFFFF",border:"1px solid #D8D8D5",borderRadius:0,
    padding:"9px 12px",color:"#111110",fontSize:13,outline:"none",
    width:"100%",boxSizing:"border-box",fontFamily:"inherit"},
  badges:{green:{bg:"#F0FDF4",c:"#15803D"},amber:{bg:"#FFFBEB",c:"#92400E"},
    red:{bg:"#FEF2F2",c:"#DC2626"},blue:{bg:"#EFF6FF",c:"#1D4ED8"},
    gray:{bg:"#F4F4F2",c:"#52525B"}},
  mono:"'DM Mono',monospace",
};

// ═══════════════════════════════════════════════════════════════
//  GLOBAL FIELD TYPE REGISTRY
//  One definition → applied identically across ALL 39 tables
// ═══════════════════════════════════════════════════════════════
const SHOE_SIZES=["4","4.5","5","5.5","6","6.5","7","7.5","8","8.5","9","9.5","10","10.5","11","11.5","12","12.5","13","14","15","Measurement Provided","Custom"];
const SHOE_TYPES=["Oxford","Loafer","Derby","Monk","Chelsea","Balmoral","Moccasin","Boot","Trainer","Brogue","Lace-Up","Slipper","Sandal","Other"];
const COUNTRIES=["Pakistan","USA","UK","Canada","UAE","Saudi Arabia","Australia","Germany","France","Italy","Other"];
const SOURCES=["Etsy","Website","Direct","Instagram","WhatsApp","Referral","Friend","Other"];
const HANDSOLE_FARMA_OPTIONS=[{value:"101",label:"101"},{value:"201",label:"201"},{value:"301",label:"301"},{value:"401",label:"401"},{value:"501",label:"501"},{value:"601",label:"601"},{value:"7",label:"7 Ladies Gol"},{value:"8",label:"8 Ladies Chauras"}];
const STATUS_GEN=["Available","Ready","Move to Production","In Stock","Low","Out of Stock","Used","Sold","In Progress","On Hold","Completed"];
const PASS_FAIL=["Pass","Fail","N/A","Not Checked"];
const YES_NO=["Yes","No"];
const OK_FAULTY=["OK","Faulty"];
const SOLE_BACK_FINISH_OPTIONS=["Red","Brown","Natural","Black","Tan"];
const SOLE_SIDE_FINISH_OPTIONS=["Natural","Tan","Brown","Black"];
const EXTRA_USAGE_TYPES=["Shoe Making","Electric","Hardware","Wood","Packaging","Repair","Shop Setup","Cleaning","Office","Other"];
const EXTRA_MATERIAL_TYPES=["Shoe Making","Electric","Hardware","Wood","Wire","Metal","Plastic","Tool Part","Container","Stationery","Spare Part","Packaging","Repair","Shop Setup","Cleaning","Office","Other"];
const STORAGE_LOCATIONS=["Workshop","Store Room","Rack","Drawer","Tool Box","Shelf","Shop","Unit","Other"];
const KNOWLEDGE_CATEGORIES=["Communication","Upper Design","Bottom","Bottom Assembly","Finishing","Production Supervision","Farma","Size","Picture","Order Placement & Documentation","Material Management","General","Other"];
const MARKETING_VIDEO_TYPES=["Upper Making","Bottom Making","Full Pair","Finishing","Marketing","Customer Showcase","Tutorial","Process","Other"];
const WORK_ORDER_USAGE_STATUSES=["Open","Started Working","In Progress","On Hold","Completed","Cancelled"];
const MATERIAL_USAGE_ACTIONS=["None","Reserve Materials","Consume Materials","Release Materials"];
const WORK_ORDER_TYPES=["Upper","Bottom","Finish","Order Local","International Order"];
const WORK_ORDER_DEPARTMENTS=["Upper","Bottom","Finishing","Order","Quality","Packing","Dispatch"];
const WORK_ORDER_STATUS=["Pending","Started Working","In Progress","On Hold","Ready for Review","Completed","Cancelled"];
const ORDER_SCOPE_TYPES=["Local Pakistan Order","International Order","Stock Work","Repair / Rework","Sample / Prototype"];
const CUSTOMER_SIZE_MODES=["Generic Size","Provided Measurement"];

const LEATHER_COLOR_OPTIONS=[
  "Black","Brown","Dark Brown","Light Brown","Tan","Cognac","Walnut","Chestnut","Burgundy","Oxblood","Maroon",
  "Navy Blue","Blue","Light Blue","Dark Blue","Grey","Charcoal","White","Off White","Cream","Beige",
  "Green","Olive Green","Red","Orange","Yellow","Purple","Pink","Gold","Silver","Natural","Camel","Taupe",
  "Suede Tan","Suede Brown","Suede Black","Multi Color","Black Chrome","Silver Chrome","Golden","Gold","Black Gold","Antique Brass","Brass","Gunmetal","Copper","Rose Gold","Nickel","Other"
];
const UPPER_LEATHER_PATTERNS=["Plain","Choti Dabi","Plain Black","Bari Dabi","Ostrich","Plain Brown","Plain Tan","Plan Brown","Plain Green","Plain Marron","Crust White","Snake","Crocodile","Cheetayee","Danedar","Plain Red","Plain Blue","Suede","Mix Pieces","Other"];
const HEEL_TOP_TYPES=["Moti","Patli","Plain without Laser","With Laser"];
const HEEL_TYPE_OPTIONS=["Wood","Rubber","Leather","Leather Board"];
const HEEL_THICKNESS_OPTIONS=["Universal","1 inch",".5 inch","Other"];
const HEEL_THICKNESS_TYPE_OPTIONS=["Universal","Moti","Patli","Single Taapi"];
const PAIR_FINISH_STATUSES=["Unfinished","Sole Regrai","Upper Finish","Bottom Finish","Complete Finish","Refinish"];
const ELASTIC_STATUS_OPTIONS=["Available","Near End","Finished","Out of Stock"];
const PUTHA_STATUS_OPTIONS=["In Stock","Move to Production","Move to Laser","Near End","Finished","Out of Stock"];
const SOLE_STATUS_OPTIONS=["Available","Move to Laser","Reserved","Consumed","Damaged"];
const SOLE_THICKNESS_OPTIONS=["Mota","Patla"];
const SOLE_DESIGN_TYPE_OPTIONS=["Plain","Lasered"];
const SOLE_SHEET_STATUS_OPTIONS=["In Stock","Move to Production","Near End","Finished","Out of Stock"];
const SOOTI_WELT_TYPE_OPTIONS=["Plain","Khi 1","Khi 2","Silai Khi","Natural Leather","Natural White Dhaga","Own Colored Plain"];
const SOOTI_COLOR_OPTIONS=["Natural","Brown","Black","White","Tan","Custom"];
const SOOTI_STATUS_OPTIONS=["In Stock","Move to Production","Near End","Finished","Out of Stock"];
const LEATHER_BOARD_STATUS_OPTIONS=["In Stock","Move to Production","Near End","Finished","Out of Stock"];
const MEK_STATUS_OPTIONS=["In Stock","Move to Production","Near End","Finished","Out of Stock"];
const DYE_COLOR_OPTIONS=[
  "Red","Black","Purple","Light Green","Dark Green","Light Blue","Blue",
  "Lemon Yellow","Golden Yellow","Light Brown","Medium Brown","Dark Brown",
  "Ravi Brown","Ravi Mustard","Ravi Maroon","Ravi Black"
];
const DYE_STATUS_OPTIONS=["In Stock","Near End","Finished","Out of Stock"];
const POLISH_COMPANY_OPTIONS=["Kiwi","Daisy","Cherry Blossom"];
const POLISH_TYPE_OPTIONS=["Dabba","Tube"];
const POLISH_TIN_SIZE_OPTIONS=["20ml","45ml","90ml"];
const POLISH_TUBE_SIZE_OPTIONS=["45ml"];
const POLISH_STATUS_OPTIONS=["In Stock","Near End","Finished","Out of Stock"];
const POLISH_COLOR_OPTIONS=["Black","Brown","Neutral","White","Wax","Other"];
const RULE_CATEGORY_OPTIONS=["Upper","Bottom","Finishing","Sales","Operational","Production","Inventory","Quality","Customer","Accounting","General"];
const RULE_ACTIVE_OPTIONS=["Yes","No"];

const INSPIRATION_STATUS_OPTIONS=["Raw Reference","Ready for AI","Used in Design","Archived"];
const MEN_SHOE_STYLE_OPTIONS=[
  "Oxford",
  "Wholecut Oxford",
  "Cap Toe Oxford",
  "Plain Toe Oxford",
  "Wingtip Oxford",
  "Semi Brogue Oxford",
  "Full Brogue Oxford",
  "Derby",
  "Plain Toe Derby",
  "Cap Toe Derby",
  "Wingtip Derby",
  "Longwing Brogue",
  "Loafer",
  "Penny Loafer",
  "Tassel Loafer",
  "Horsebit Loafer",
  "Apron Toe Loafer",
  "Belgian Loafer",
  "Slip-On",
  "Monk Strap",
  "Single Monk Strap",
  "Double Monk Strap",
  "Boot",
  "Chelsea Boot",
  "Chukka Boot",
  "Jodhpur Boot",
  "Dress Boot",
  "Balmoral Boot",
  "Ankle Boot",
  "Mule / Backless Loafer",
  "Sandal",
  "Slipper",
  "Other"
];
const INSPIRATION_TOE_OPTIONS=["Pointed","Almond","Round","Square","Cap Toe","Apron Toe","Wingtip","Plain Toe","Other"];
const INSPIRATION_CLOSURE_OPTIONS=["Lace Up","Slip On","Monk Strap","Buckle","Horsebit","Tassel","Zipper","Elastic","Backless","Other"];

const LASER_PATTERN_NAME_OPTIONS=[
  "Crocodile Belly Scale Emboss","Crocodile / Alligator Texture","Snake Scale Emboss","Lizard Scale Emboss","Ostrich Leather Emboss",
  "Pebble Grain Emboss","Micro Box Grid","Diamond Grid","Micro Diamond Grid","Wave Emboss","Micro Perforated Look",
  "Rectangular Cell Pattern","Square Frame Emboss","Micro Cross Weave","3D Hexagonal Weave","Plain Texture","Custom"
];
const LASER_PATTERN_TYPE_OPTIONS=[
  "Crocodile / Alligator Texture","Snake Texture","Lizard Texture","Ostrich Texture",
  "Pebble Grain Texture","Animal Texture",
  "Weave","Micro Weave","Cross Weave","Hexagonal Weave","Grid","Diamond Grid",
  "Box Grid","Wave","Perforated","Micro Perforated","Cell Pattern","Frame Pattern",
  "Geometric","Texture","Emboss","Floral","Custom","Other"
];
const LASER_PATTERN_LEATHER_OPTIONS=[
  "Plain Leather","Smooth Full Grain","Aniline Leather","Suede","Nubuck",
  "Patent Leather","Textured Leather","Not For Suede","Not For Patent","Other"
];
const LASER_PATTERN_STATUS_OPTIONS=["Raw Pattern","Ready for AI","Used in Design","Archived"];



const HEEL_TOP_TYPE_OPTIONS=["Moti","Patli","Plain without Laser","With Laser","Universal"];
const HEEL_TOP_STATUS_OPTIONS=["In Stock","Move to Production","Move to Laser","Near End","Finished","Out of Stock"];
const SOLE_TYPE_SIMPLE_OPTIONS=SOLE_THICKNESS_OPTIONS;
const THREAD_TYPE_OPTIONS=["Mota","Patla","Pindi","Imported","Cotton","Polyester","Cotton Mix"];
const THREAD_STATUS_OPTIONS=["Available","Near End","Finished","Out of Stock"];
const BUCKLE_COLOR_OPTIONS=["Black Chrome","Silver Chrome","Golden","Gold","Black Gold","Antique Brass","Brass","Gunmetal","Copper","Rose Gold","Nickel","Silver","Black","Brown","Other"];
const PAIR_STOCK_STATUSES=["Available","Reserved","Sold","Order Fulfilled","In Progress","On Hold"];

// Global field type registry: field key → {t, opts?, rel?}
const FT={
  // ── Images ──────────────────────────────────────────────────
  image_url:{t:"img"},fault_image_url:{t:"img"},receipt_url:{t:"img"},
  foot_img_left:{t:"img"},foot_img_right:{t:"img"},
  representative_image_url:{t:"img"},quality_fault_image_url:{t:"img"},
  quality_paitawa_image_url:{t:"img"},quality_upper_silal_image_url:{t:"img"},quality_colored_adda_image_url:{t:"img"},
  quality_bottom_image_url:{t:"img"},quality_heel_image_url:{t:"img"},
  quality_upper_finish_image_url:{t:"img"},quality_sole_edge_image_url:{t:"img"},
  quality_silwat_image_url:{t:"img"},quality_sole_equal_image_url:{t:"img"},
  quality_symmetry_flex_image_url:{t:"img"},quality_sole_attachment_image_url:{t:"img"},
  quality_channel_depth_image_url:{t:"img"},quality_bottom_stitching_image_url:{t:"img"},
  quality_edge_smooth_image_url:{t:"img"},quality_zero_raigmal_image_url:{t:"img"},
  video_url:{t:"video"},

  // ── Relations (linked record dropdowns) ─────────────────────
  customer_id:{t:"rel",rel:{table:"customers",display:"customer_name",img:"image_url"}},
  farma_id:{t:"rel",rel:{table:"farma",display:"option_no",img:"image_url",fields:["size"],showId:true,prefix:"Farma"}},
  bottom_farma_id:{t:"rel",rel:{table:"farma",display:"option_no",img:"image_url",fields:["size"],showId:true,prefix:"Farma"}},
  buckle_id:{t:"rel",rel:{table:"buckles",display:"color",img:"image_url"}},
  lace_id:{t:"rel",rel:{table:"laces",display:"color",img:"image_url"}},
  heel_id:{t:"rel",rel:{table:"heels",display:"heel_type",img:"image_url"}},
  sooti_welt_id:{t:"rel",rel:{table:"sooti_welt",display:"welt_type",img:"image_url"}},
  finishing_id:{t:"rel",rel:{table:"finishing",display:"color",img:"image_url"}},
  shoe_polish_id:{t:"rel",rel:{table:"shoe_polish",display:"color",img:"image_url"}},
  upper_id:{t:"rel",rel:{table:"uppers",display:"style",img:"image_url",fields:["size","status","stock_or_order","made_by"],showId:true,prefix:"Upper"}},
  related_pair_id:{t:"rel",rel:{table:"finish_inventory",display:"type",img:"image_url",fields:["size","color"],showId:true,prefix:"Pair"}},
  belt_id:{t:"rel",rel:{table:"belts",display:"belt_name",img:"image_url",fields:["size_inches","color"],showId:true,prefix:"Belt"}},
  elastic_id:{t:"rel",rel:{table:"elastic",display:"color",img:"image_url",fields:["width","size_meters"],showId:true,prefix:"Elastic"}},
  thread_id:{t:"rel",rel:{table:"thread",display:"color",img:"image_url",fields:["type","use_for"],showId:true,prefix:"Thread"}},
  leather_sole_id:{t:"rel",rel:{table:"laser_sole",display:"size",img:"image_url",fields:["farma_option","status"],showId:true,prefix:"Leather Sole"}},
  rubber_sole_id:{t:"rel",rel:{table:"rubber_laser_sole",display:"size",img:"image_url",fields:["farma_option","status"],showId:true,prefix:"Rubber Sole"}},
  putha_id:{t:"rel",rel:{table:"putha_sole_leather",display:"name_type",img:"image_url",fields:["color","status"],showId:true,prefix:"Putha"}},
  heel_top_id:{t:"rel",rel:{table:"heel_tops",display:"type",img:"image_url",fields:["thickness_mm"],showId:true,prefix:"Tapi"}},
  sole_sheet_id:{t:"rel",rel:{table:"sole_sheets",display:"name",img:"image_url",fields:["size","label"],showId:true,prefix:"Sheet"}},
  leather_board_id:{t:"rel",rel:{table:"leather_board",display:"name_type",img:"image_url",fields:["thickness","quantity_sheets"],showId:true,prefix:"Board"}},
  mek_id:{t:"rel",rel:{table:"mek_sheet",display:"thickness",img:"image_url",fields:["quantity","size"],showId:true,prefix:"MEK"}},
  solution_id:{t:"rel",rel:{table:"solution",display:"name",fields:["quantity","used_where"],showId:true,prefix:"Solution"}},
  measurement_id:{t:"rel",rel:{table:"customer_measurements",display:"customer_name",img:"foot_img_left",fields:["size","unit"],showId:true,prefix:"Measure"}},
  marketing_video_id:{t:"rel",rel:{table:"marketing_videos",display:"video_type",fields:["status","tags"],showId:true,prefix:"Video"}},
  fault_id:{t:"rel",rel:{table:"faults_book",display:"fault_area",img:"fault_image_url",fields:["fault_status"],showId:true,prefix:"Fault"}},
  upper_leather_id:{t:"rel",rel:{table:"upper_leather",display:"type_pattern",img:"image_url"}},
  lining_leather_id:{t:"rel",rel:{table:"lining_leather",display:"color",img:"image_url"}},
  inspiration_id:{t:"rel",rel:{table:"inspiration_library",display:"tags",img:"image_url"}},
  work_order_id:{t:"rel",rel:{table:"work_orders",display:"serial_number",showId:true,prefix:"WO"}},


  material_record_id:{t:"num"},quantity_used:{t:"num"},quantity_available:{t:"num"},upper_leather_qty_used:{t:"num"},lining_leather_qty_used:{t:"num"},buckle_qty_used:{t:"num"},lace_qty_used:{t:"num"},elastic_qty_used:{t:"num"},thread_qty_used:{t:"num"},leather_sole_qty_used:{t:"num"},rubber_sole_qty_used:{t:"num"},putha_qty_used:{t:"num"},heel_qty_used:{t:"num"},heel_top_qty_used:{t:"num"},sooti_qty_used:{t:"num"},sole_sheet_qty_used:{t:"num"},leather_board_qty_used:{t:"num"},mek_qty_used:{t:"num"},finishing_qty_used:{t:"num"},shoe_polish_qty_used:{t:"num"},solution_qty_used:{t:"num"},
  material_usage_action:{t:"sel",opts:MATERIAL_USAGE_ACTIONS},usage_status:{t:"sel",opts:["Reserved","Consumed","Released"]},material_table:{t:"sel",opts:["upper_leather","lining_leather","buckles","laces","elastic","thread","laser_sole","rubber_laser_sole","putha_sole_leather","heels","heel_tops","sooti_welt","sole_sheets","leather_board","mek_sheet","finishing","shoe_polish","solution"]},material_category:{t:"sel",opts:["Upper","Bottom","Finish"]},

  // ── Booleans (Yes/No toggle) ─────────────────────────────────
  is_done:{t:"bool"},is_buckle_used:{t:"bool"},is_lace_needed:{t:"bool"},
  is_tassel:{t:"bool"},is_paitava:{t:"bool"},is_active:{t:"bool"},
  is_critical:{t:"bool"},available:{t:"bool"},content_available:{t:"bool"},
  paitava_available:{t:"bool"},is_size_provided:{t:"bool"},

  // ── Dates (calendar picker) ──────────────────────────────────
  production_date:{t:"date"},order_date:{t:"date"},delivery_date:{t:"date"},due_date:{t:"date"},
  date_made:{t:"date"},procurement_date:{t:"date"},date_purchased:{t:"date"},
  purchase_date:{t:"date"},date_added:{t:"date"},date_received:{t:"date"},
  date:{t:"date"},date_received_income:{t:"date"},assigned_date:{t:"date"},
  return_due_date:{t:"date"},actual_return_date:{t:"date"},
  resolution_date:{t:"date"},fault_date:{t:"date"},finish_date:{t:"date"},
  last_used_date:{t:"date"},last_updated:{t:"date"},deduction_date:{t:"date"},
  upload_date:{t:"date"},planned_date:{t:"date"},quality_check_date:{t:"date"},
  polish_date:{t:"date"},date_added_made:{t:"date"},date_consumed:{t:"date"},

  // ── Numbers ──────────────────────────────────────────────────
  quantity:{t:"num"},quantity_left:{t:"num"},quantity_in_pairs:{t:"num"},
  quantity_inches:{t:"num"},quantity_sheets:{t:"num"},available_quantity:{t:"num"},
  unit_quantity:{t:"num"},stock_count:{t:"num"},pieces_count:{t:"num"},
  number_of_pairs:{t:"num"},total_sales_price:{t:"num"},advance_payment:{t:"num"},
  amount_received:{t:"num"},price_per_unit:{t:"num"},price_per_meter:{t:"num"},
  unit_price:{t:"num"},purchasing_price:{t:"num"},purchase_value:{t:"num"},
  threshold_alert_level:{t:"num"},point_a:{t:"num"},point_b:{t:"num"},
  point_c:{t:"num"},point_d:{t:"num"},point_e:{t:"num"},point_f:{t:"num"},
  wo_point_a:{t:"num"},wo_point_b:{t:"num"},wo_point_c:{t:"num"},
  wo_point_d:{t:"num"},wo_point_e:{t:"num"},size_unit_sqft:{t:"num"},
  size_meters:{t:"num"},thickness_mm:{t:"num"},rule_number:{t:"num"},
  debit:{t:"num"},credit:{t:"num"},balance:{t:"num"},

  // ── Long text (textarea) ─────────────────────────────────────
  notes:{t:"long"},address:{t:"long"},delivery_instructions:{t:"long"},
  upper_instructions:{t:"long"},bottom_comments:{t:"long"},finish_comments:{t:"long"},
  quality_fault_explanation:{t:"long"},
  quality_paitawa_issue:{t:"long"},quality_upper_silal_issue:{t:"long"},quality_colored_adda_issue:{t:"long"},
  quality_bottom_issue:{t:"long"},quality_heel_issue:{t:"long"},
  quality_upper_finish_issue:{t:"long"},quality_sole_edge_issue:{t:"long"},
  quality_silwat_issue:{t:"long"},quality_sole_equal_issue:{t:"long"},
  quality_symmetry_flex_issue:{t:"long"},quality_sole_attachment_issue:{t:"long"},
  quality_channel_depth_issue:{t:"long"},quality_bottom_stitching_issue:{t:"long"},
  quality_edge_smooth_issue:{t:"long"},quality_zero_raigmal_issue:{t:"long"},
  remarks:{t:"long"},tool_history:{t:"long"},
  rule_description:{t:"long"},point_info:{t:"long"},explain_design:{t:"long"},
  description:{t:"long"},action_taken:{t:"long"},usage_log:{t:"long"},
  selected_leathers:{t:"long"},production_comments_notes:{t:"long"},

  // ── Select dropdowns ─────────────────────────────────────────
  size:{t:"sel",opts:SHOE_SIZES},
  bottom_size:{t:"sel",opts:SHOE_SIZES},
  size_inches:{t:"sel",opts:["28","30","32","34","36","38","40","42","44","46","Custom"]},
  type:{t:"sel",opts:SHOE_TYPES},
  style:{t:"sel",opts:SHOE_TYPES},
  color:{t:"sel",opts:LEATHER_COLOR_OPTIONS},
  colour:{t:"sel",opts:LEATHER_COLOR_OPTIONS},
  country:{t:"sel",opts:COUNTRIES},
  source:{t:"sel",opts:SOURCES},
  knowledge_category:{t:"sel",opts:KNOWLEDGE_CATEGORIES},
  rule_category:{t:"sel",opts:RULE_CATEGORY_OPTIONS},
  type_pattern:{t:"sel",opts:UPPER_LEATHER_PATTERNS},
  option_no:{t:"sel",opts:HANDSOLE_FARMA_OPTIONS.map(o=>o.label)},
  delivery_status:{t:"sel",opts:["Pending","Processing","Shipped","In Transit","Delivered","Returned"]},
  customer_size_mode:{t:"sel",opts:CUSTOMER_SIZE_MODES},
  customer_size_type:{t:"sel",opts:CUSTOMER_SIZE_MODES},
  work_order_type:{t:"sel",opts:WORK_ORDER_TYPES},
  department:{t:"sel",opts:WORK_ORDER_DEPARTMENTS},
  work_order_status:{t:"sel",opts:WORK_ORDER_STATUS},
  order_scope:{t:"sel",opts:ORDER_SCOPE_TYPES},
  stock_or_order:{t:"sel",opts:["Order","Stock"]},
  finish_status:{t:"sel",opts:PAIR_FINISH_STATUSES},
  status:{t:"sel",opts:STATUS_GEN},
  work_order_status:{t:"sel",opts:WORK_ORDER_USAGE_STATUSES},
  lace_type:{t:"sel",opts:["Wax","Flat Round","Round","Cotton","Leather","Nylon","Other"]},
  elastic_status:{t:"sel",opts:ELASTIC_STATUS_OPTIONS},
  putha_status:{t:"sel",opts:PUTHA_STATUS_OPTIONS},
  sole_status:{t:"sel",opts:SOLE_STATUS_OPTIONS},
  rubber_status:{t:"sel",opts:SOLE_STATUS_OPTIONS},
  sole_sheet_status:{t:"sel",opts:SOLE_SHEET_STATUS_OPTIONS},
  leather_board_status:{t:"sel",opts:LEATHER_BOARD_STATUS_OPTIONS},
  mek_status:{t:"sel",opts:MEK_STATUS_OPTIONS},
  dye_color:{t:"sel",opts:DYE_COLOR_OPTIONS},
  dye_status:{t:"sel",opts:DYE_STATUS_OPTIONS},
  polish_color:{t:"sel",opts:POLISH_COLOR_OPTIONS},
  polish_company:{t:"sel",opts:POLISH_COMPANY_OPTIONS},
  polish_type:{t:"sel",opts:POLISH_TYPE_OPTIONS},
  polish_weight_size:{t:"sel",opts:[...POLISH_TIN_SIZE_OPTIONS,...POLISH_TUBE_SIZE_OPTIONS]},
  polish_status:{t:"sel",opts:POLISH_STATUS_OPTIONS},
  heel_top_type:{t:"sel",opts:HEEL_TOP_TYPE_OPTIONS},
  heel_top_status:{t:"sel",opts:HEEL_TOP_STATUS_OPTIONS},
  sole_thickness_type:{t:"sel",opts:SOLE_THICKNESS_OPTIONS},
  sole_design_type:{t:"sel",opts:SOLE_DESIGN_TYPE_OPTIONS},
  heel_type:{t:"sel",opts:HEEL_TYPE_OPTIONS},
  heel_thickness:{t:"sel",opts:HEEL_THICKNESS_OPTIONS},
  heel_thickness_type:{t:"sel",opts:HEEL_THICKNESS_TYPE_OPTIONS},
  thickness:{t:"sel",opts:HEEL_THICKNESS_OPTIONS},
  thickness_type:{t:"sel",opts:HEEL_THICKNESS_TYPE_OPTIONS},
  thread_type:{t:"sel",opts:THREAD_TYPE_OPTIONS},
  thread_status:{t:"sel",opts:THREAD_STATUS_OPTIONS},
  welt_type:{t:"sel",opts:SOOTI_WELT_TYPE_OPTIONS},
  sooti_color:{t:"sel",opts:SOOTI_COLOR_OPTIONS},
  sooti_status:{t:"sel",opts:SOOTI_STATUS_OPTIONS},
  unit:{t:"sel",opts:["Centimeter","Inch"]},
  unit_type:{t:"sel",opts:["Sq Foot","Meter","Piece","Pair"]},
  with_sooti:{t:"sel",opts:["With Sooti","Without Sooti"]},
  is_sooti_used:{t:"sel",opts:["Yes","No"]},
  sooti_half_full:{t:"sel",opts:["Half","Full"]},
  sole_material_choice:{t:"sel",opts:["Leather Sole","Rubber Sole"]},
  sole_type:{t:"sel",opts:["Pasting","Single Sole Silai","Sooti","Double Sole Rubber","Vibram Sole","Sooti Half","Sooti Full"]},
  sole_making:{t:"sel",opts:["Chipkai","Silai"]},
  sole_back_finish:{t:"sel",opts:SOLE_BACK_FINISH_OPTIONS},
  sole_side_finish:{t:"sel",opts:SOLE_SIDE_FINISH_OPTIONS},
  payment_type:{t:"sel",opts:["Full Payment","Advance","Partial","Refund"]},
  income_unit_type:{t:"sel",opts:["Pair","Belt","Repair","Custom Order","Other"]},
  expense_category:{t:"sel",opts:["Leather Purchase","Bottom Material","Finishing Material","Tools","Repair / Maintenance","Salary / Labor","Rent","Electricity / Utilities","Transport","Shipping","Marketing","Packaging","Office / Admin","Food / Tea","Other"]},
  priority:{t:"sel",opts:["High","Normal","Low"]},
  quality_paitawa:{t:"sel",opts:YES_NO},quality_upper_silal:{t:"sel",opts:OK_FAULTY},quality_colored_adda:{t:"sel",opts:YES_NO},
  quality_bottom:{t:"sel",opts:OK_FAULTY},quality_heel:{t:"sel",opts:OK_FAULTY},
  quality_upper_finish:{t:"sel",opts:OK_FAULTY},quality_sole_edge:{t:"sel",opts:OK_FAULTY},
  quality_silwat:{t:"sel",opts:YES_NO},quality_sole_equal:{t:"sel",opts:OK_FAULTY},
  quality_symmetry_flex:{t:"sel",opts:OK_FAULTY},quality_sole_attachment:{t:"sel",opts:OK_FAULTY},
  quality_channel_depth:{t:"sel",opts:OK_FAULTY},quality_bottom_stitching:{t:"sel",opts:OK_FAULTY},
  quality_edge_smooth:{t:"sel",opts:OK_FAULTY},quality_zero_raigmal:{t:"sel",opts:YES_NO},
  fault_area:{t:"sel",opts:["Upper","Bottom","Finish","Heel","Sole Edge","Stitching","Lining","Paitava","Buckle","Lace","Color","Shape","Other"]},
  fault_status:{t:"sel",opts:["Open","In Progress","Resolved","Closed","Wont Fix"]},
  thickness:{t:"text"},
  thickness_type:{t:"sel",opts:["Moti","Patli"]},
  current_condition:{t:"sel",opts:["New","Good","Fair","Poor","Needs Repair"]},
  tool_status:{t:"sel",opts:["Available","Assigned","Under Repair","Retired","Lost"]},
  use_for:{t:"sel",opts:["Upper","Bottom","Both"]},
  video_type:{t:"sel",opts:MARKETING_VIDEO_TYPES},
  video_status:{t:"sel",opts:["Draft","Published","Archived"]},
  upper_new_or_old:{t:"sel",opts:["NEW","EXISTING"]},
  type_of_inspiration:{t:"sel",opts:["Complete Pair","Upper Design","Bottom","Bottom Assembly","Sole Design","Both","Color Scheme","Shape","Finishing","Heel Design","Pattern","Texture","Hardware","Other"]},
  design_type:{t:"sel",opts:MEN_SHOE_STYLE_OPTIONS},
  inspiration_status:{t:"sel",opts:INSPIRATION_STATUS_OPTIONS},
  toe_shape:{t:"sel",opts:INSPIRATION_TOE_OPTIONS},
  closure_type:{t:"sel",opts:INSPIRATION_CLOSURE_OPTIONS},
  pattern_name:{t:"sel",opts:LASER_PATTERN_NAME_OPTIONS},
  pattern_type:{t:"sel",opts:LASER_PATTERN_TYPE_OPTIONS},
  upper_leather_type:{t:"sel",opts:LASER_PATTERN_LEATHER_OPTIONS},
  laser_pattern_status:{t:"sel",opts:LASER_PATTERN_STATUS_OPTIONS},
  best_use:{t:"long"},
  avoid_use:{t:"long"},
  design_notes:{t:"long"},
  ai_search_summary:{t:"long"},

  design_elements:{t:"long"},
  construction_notes:{t:"long"},
  ai_search_summary:{t:"long"},

  stock_status:{t:"sel",opts:STATUS_GEN},
  leather_status:{t:"sel",opts:["Available","In Use","Used Up","Low","Out of Stock"]},
  usage:{t:"sel",opts:EXTRA_USAGE_TYPES},
  material_type:{t:"sel",opts:EXTRA_MATERIAL_TYPES},
  location_storage:{t:"sel",opts:STORAGE_LOCATIONS},
};

// Smart field resolver: returns full field config from registry or auto-detects
function resolveField(key,label){
  if(FT[key]) return{k:key,l:label,...FT[key]};
  const k=key.toLowerCase();
  // Auto-detect by name pattern
  if(k.endsWith("_date")||k.startsWith("date_")||k==="date") return{k:key,l:label,t:"date"};
  if(k.includes("image")||k.includes("photo")||k.includes("picture")||k.includes("attachment")&&k.includes("url")) return{k:key,l:label,t:"img"};
  if(k.includes("video")) return{k:key,l:label,t:"video"};
  if(k.startsWith("is_")||k.endsWith("_available")) return{k:key,l:label,t:"bool"};
  if(k.endsWith("_id")&&!["airtable_id","customer_size_id"].includes(k)) return{k:key,l:label,t:"text"};
  if(["price","amount","quantity","count","value","cost","total","advance","balance","sqft","meter","thickness","number"].some(x=>k.includes(x))) return{k:key,l:label,t:"num"};
  if(["notes","description","instructions","comments","info","history","remarks","explanation","details"].some(x=>k.includes(x))) return{k:key,l:label,t:"long"};
  return{k:key,l:label,t:"text"};
}

// ── Navigation ───────────────────────────────────────────────
const TABLE_MAP={work_orders:"work_orders",customers:"customers",measurements:"customer_measurements",inventory:"finish_inventory",uppers:"uppers",upper_leather:"upper_leather",farma:"farma",lining_leather:"lining_leather",elastic:"elastic",buckles:"buckles",laces:"laces",heels:"heels",heel_tops:"heel_tops",sooti:"sooti_welt",thread:"thread",belts:"belts",production:"production_planning",faults:"faults_book",tools:"tool_inventory",expenses:"expenses",income:"income_sales",knowledge:"knowledge_base",sops:"sops",rules:"rule_book",inspiration:"inspiration_library",patterns:"laser_pattern_catalog",videos:"marketing_videos",putha:"putha_sole_leather",laser_sole:"laser_sole",rubber_laser:"rubber_laser_sole",sole_sheets:"sole_sheets",mek:"mek_sheet",finishing:"finishing",polish:"shoe_polish",solution:"solution",leather_board:"leather_board",extra_saman:"extra_saman",material_usage:"material_usage_log",__access:"team_members"};

const NAV=[
  {g:"Production",  icon:"ti-building-warehouse", items:[
    {id:"work_orders",  l:"Work Order",            i:"ti-clipboard-list"},
    {id:"material_usage",l:"Admin Usage Log",    i:"ti-list-details"},
    {id:"customers",    l:"Customer",              i:"ti-users"},
    {id:"measurements", l:"Customer Measurement",  i:"ti-ruler"},
    {id:"production",   l:"Production Planning",   i:"ti-calendar-event"},
    {id:"__import",     l:"Import CSV Data",       i:"ti-database-import"},
  ]},
  {g:"Inventory",   icon:"ti-chart-bar", items:[
    {id:"inventory", l:"Pair",  i:"ti-package"},
    {id:"uppers",    l:"Upper", i:"ti-stack"},
    {id:"belts",     l:"Belt",  i:"ti-rectangle"},
  ]},
  {g:"Upper",       icon:"ti-affiliate", items:[
    {id:"upper_leather",  l:"Upper Leather",       i:"ti-layers-intersect"},
    {id:"farma",          l:"Farma (Lasts)",        i:"ti-shoe"},
    {id:"lining_leather", l:"Lining Leather",      i:"ti-layers"},
    {id:"buckles",        l:"Buckle",              i:"ti-link"},
    {id:"laces",          l:"Laces",               i:"ti-line-dashed"},
    {id:"elastic",        l:"Elastic (Upper Use)", i:"ti-wave-sine"},
    {id:"thread",         l:"Thread",              i:"ti-tornado"},
  ]},
  {g:"Bottom",      icon:"ti-hammer", items:[
    {id:"putha",        l:"Putha (Sole Leather)", i:"ti-layout-bottombar"},
    {id:"laser_sole",   l:"Leather Sole",         i:"ti-geometry"},
    {id:"rubber_laser", l:"Rubber Sole",          i:"ti-circles"},
    {id:"heels",        l:"Heel",                 i:"ti-triangle"},
    {id:"sooti",        l:"Sooti / Welt",         i:"ti-wave-square"},
    {id:"sole_sheets",  l:"Sole Sheets",          i:"ti-stack-2"},
    {id:"leather_board",l:"Leather Board",        i:"ti-square-half"},
    {id:"heel_tops",    l:"Heel Top (Tapi)",      i:"ti-triangle-inverted"},
    {id:"mek",          l:"MEK Sheet",            i:"ti-rectangle-vertical"},
  ]},
  {g:"Finishing",   icon:"ti-pin", items:[
    {id:"finishing", l:"Dye Color",   i:"ti-palette"},
    {id:"polish",    l:"Shoe Polish", i:"ti-circle"},
    {id:"solution",  l:"Solution",    i:"ti-droplet"},
  ]},
  {g:"Accounting",  icon:"ti-report-money", items:[
    {id:"expenses", l:"Expenses / Ledger", i:"ti-minus"},
    {id:"income",   l:"Income / Sales",    i:"ti-plus"},
  ]},
  {g:"Rules Book",  icon:"ti-book-2", items:[
    {id:"rules", l:"Rule Book", i:"ti-gavel"},
    {id:"sops",  l:"SOPs",      i:"ti-list-check"},
  ]},
  {g:"Sample Design Library", icon:"ti-paperclip", items:[
    {id:"inspiration", l:"Inspiration Library", i:"ti-photo"},
    {id:"patterns",    l:"Laser Patterns",      i:"ti-vector"},
  ]},
  // ── Single items — grouped at bottom ──────────────────────
  {g:"__SINGLES__", icon:"", items:[
    {id:"tools",       l:"Tool Inventory",  i:"ti-tool"},
    {id:"faults",      l:"Faults Book",     i:"ti-alert-triangle"},
    {id:"videos",      l:"Marketing Videos",i:"ti-video"},
    {id:"knowledge",   l:"Knowledge Base",  i:"ti-book"},
    {id:"extra_saman", l:"Extra Saman",     i:"ti-box"},
    {id:"__access",    l:"Team & Access",   i:"ti-shield-lock"},
  ]},
];

const ALL_NAV=NAV.flatMap(g=>g.items);

// ═══════════════════════════════════════════════════════════════
//  TABLE SECTIONS
//  Each entry: {title, fields:[{k:"db_col", l:"Label"}]}
//  Types come automatically from FT registry or auto-detection
// ═══════════════════════════════════════════════════════════════
const SECTIONS={
  work_orders:[
    {t:"Core Work Order",f:[{k:"id",l:"DB #"},{k:"work_order_status",l:"Work Status"},{k:"priority",l:"Priority"},{k:"assigned_to",l:"Assigned To"},{k:"stock_or_order",l:"Stock or Order"},{k:"representative_image_url",l:"Representative Photo"}]},
    {t:"Main Links",f:[{k:"customer_id",l:"Customer"},{k:"related_pair_id",l:"Related Pair / Inventory"},{k:"upper_id",l:"Related Upper"},{k:"measurement_id",l:"Customer Measurement"}],showFor:["Order Local","International Order"]},
    {t:"Customer Details",f:[{k:"customer_name",l:"Customer Name"},{k:"phone_number",l:"Phone"},{k:"email",l:"Email"},{k:"country",l:"Country"},{k:"source",l:"Source"},{k:"address",l:"Address"},{k:"delivery_instructions",l:"Delivery Instructions"},{k:"tracking_id",l:"Tracking ID"},{k:"delivery_status",l:"Delivery Status"},{k:"order_date",l:"Order Date"},{k:"delivery_date",l:"Delivery Date"}],showFor:["Order Local","International Order"]},
    {t:"Size & Measurements",f:[{k:"is_size_provided",l:"Size Provided?"},{k:"size",l:"Shoe Size"},{k:"unit",l:"Measurement Unit"},{k:"wo_point_a",l:"Point A"},{k:"wo_point_b",l:"Point B"},{k:"wo_point_c",l:"Point C"},{k:"wo_point_d",l:"Point D"},{k:"wo_point_e",l:"Point E"}],showFor:["Order Local","International Order"]},
    {t:"Upper Start",f:[{k:"inspiration_id",l:"Inspiration Reference"},{k:"upper_new_or_old",l:"Upper New or Existing"},{k:"upper_id",l:"Existing Upper Link"},{k:"design_name",l:"Design Name"}],showFor:["Upper","Order Local","International Order"]},
    {t:"Upper Section",f:[{k:"upper_leather_id",l:"Upper Leather"},{k:"farma_id",l:"Farma / Last"},{k:"lining_leather_id",l:"Lining Leather"},{k:"buckle_id",l:"Buckle"},{k:"lace_id",l:"Laces"},{k:"elastic_id",l:"Elastic"},{k:"thread_id",l:"Thread"},{k:"explain_design",l:"Explain Design"},{k:"upper_instructions",l:"Upper Instructions"}],showFor:["Upper","Order Local","International Order"]},
    {t:"Bottom Section",f:[{k:"upper_id",l:"Available Upper to Start Bottom"},{k:"sole_material_choice",l:"Sole Material"},{k:"leather_sole_id",l:"Leather Sole"},{k:"rubber_sole_id",l:"Rubber Sole"},{k:"putha_id",l:"Putha Sole Leather"},{k:"bottom_farma_id",l:"Bottom Farma / Last"},{k:"heel_id",l:"Heel"},{k:"heel_top_id",l:"Heel Top / Tapi"},{k:"is_sooti_used",l:"Is Sooti Used?"},{k:"sooti_half_full",l:"Sooti Half / Full"},{k:"sooti_welt_id",l:"Sooti Type"},{k:"sole_sheet_id",l:"Sole Sheet"},{k:"leather_board_id",l:"Leather Board"},{k:"mek_id",l:"MEK Sheet"},{k:"solution_id",l:"Solution"},{k:"bottom_size",l:"Bottom Size"},{k:"sole_type",l:"Sole Type"},{k:"sole_making",l:"Sole Making"},{k:"bottom_comments",l:"Bottom Instructions"},{k:"date_consumed",l:"Date Consumed"}],showFor:["Bottom","Order Local","International Order"]},
    {t:"Finish Section",f:[{k:"related_pair_id",l:"Pair From Inventory to Finish"},{k:"finishing_id",l:"Dye / Finishing Color"},{k:"shoe_polish_id",l:"Shoe Polish"},{k:"sole_side_finish",l:"Sole Side"},{k:"sole_back_finish",l:"Sole Back Finish"},{k:"finish_date",l:"Date"},{k:"finish_done_by",l:"Done By / Finishman"},{k:"finish_comments",l:"Additional Comments"}],showFor:["Finish","Order Local","International Order"]},
    {t:"Upper Quality Gate",f:[{k:"quality_paitawa",l:"Paitawa"},{k:"quality_upper_silal",l:"Upper Silal"},{k:"quality_colored_adda",l:"Colored Adda"}],showFor:["Upper"]},
    {t:"Bottom Quality Gate",f:[{k:"quality_silwat",l:"Silwat"},{k:"quality_sole_equal",l:"Left / Right Sole Equal"},{k:"quality_symmetry_flex",l:"Symmetry & Flex Check"},{k:"quality_sole_attachment",l:"Sole Attachment / Minimal Glue"},{k:"quality_channel_depth",l:"Bottom Channel Depth"},{k:"quality_bottom_stitching",l:"Bottom Stitching"},{k:"quality_edge_smooth",l:"Bottom Edge Smooth"},{k:"quality_zero_raigmal",l:"Zero Raigmal Done"}],showFor:["Bottom"]},
    {t:"Finish Quality Gate",f:[{k:"quality_upper_finish",l:"Upper Finish"}],showFor:["Finish"]},
    {t:"Full Pair Quality Section",f:[{k:"quality_paitawa",l:"Paitawa"},{k:"quality_upper_silal",l:"Upper Silal"},{k:"quality_colored_adda",l:"Colored Adda"},{k:"quality_silwat",l:"Silwat"},{k:"quality_sole_equal",l:"Left / Right Sole Equal"},{k:"quality_symmetry_flex",l:"Symmetry & Flex Check"},{k:"quality_sole_attachment",l:"Sole Attachment / Minimal Glue"},{k:"quality_channel_depth",l:"Bottom Channel Depth"},{k:"quality_bottom_stitching",l:"Bottom Stitching"},{k:"quality_edge_smooth",l:"Bottom Edge Smooth"},{k:"quality_zero_raigmal",l:"Zero Raigmal Done"},{k:"quality_upper_finish",l:"Upper Finish"},{k:"quality_fault_explanation",l:"Overall Quality Notes"},{k:"quality_fault_image_url",l:"Overall Quality Photo"}],showFor:["Order Local","International Order"]},
    {t:"Finance",f:[{k:"total_sales_price",l:"Total Sales Price"},{k:"advance_payment",l:"Advance Payment"},{k:"balance_payment",l:"Balance (auto)"}],showFor:["Order Local","International Order"]},
    {t:"Material Usage Control",f:[{k:"material_usage_action",l:"Usage Action"},{k:"used_by",l:"Used By"},{k:"date_used",l:"Usage Date"}],showFor:["Upper","Bottom","Finish","Order Local","International Order"]},
    {t:"Follow-up Links",f:[{k:"marketing_video_id",l:"Marketing / Process Video"},{k:"fault_id",l:"Related Fault"},{k:"belt_id",l:"Related Belt"}],showFor:["Upper","Bottom","Finish","Order Local","International Order"]},
  ],
  customers:[
    {t:"Customer Info",f:[{k:"image_url",l:"Photo"},{k:"id",l:"DB #"},{k:"customer_name",l:"Full Name"},{k:"country",l:"Country"},{k:"source",l:"Source"},{k:"phone_number",l:"Phone"},{k:"email",l:"Email"}]},
    {t:"Size Source",f:[{k:"customer_size_mode",l:"Size Type"},{k:"size",l:"Generic Shoe Size"},{k:"unit",l:"Measurement Unit"},{k:"point_a",l:"Point A"},{k:"point_b",l:"Point B"},{k:"point_c",l:"Point C"},{k:"point_d",l:"Point D"},{k:"point_e",l:"Point E"}]},
    {t:"Delivery",f:[{k:"address",l:"Address"},{k:"delivery_instructions",l:"Delivery Instructions"},{k:"order_date",l:"Order Date"},{k:"delivery_status",l:"Delivery Status"},{k:"tracking_id",l:"Tracking ID"}]},
  ],
  measurements:[
    {t:"Customer",f:[{k:"id",l:"DB #"},{k:"customer_name",l:"Customer Name"},{k:"customer_size_mode",l:"Size Type"},{k:"size",l:"Generic Shoe Size"},{k:"unit",l:"Unit"}]},
    {t:"Measurements (CM or Inch)",f:[{k:"point_a",l:"Point A"},{k:"point_b",l:"Point B"},{k:"point_c",l:"Point C"},{k:"point_d",l:"Point D"},{k:"point_e",l:"Point E"},{k:"point_f",l:"Point F"},{k:"notes",l:"Notes"}]},
    {t:"Foot Impressions",f:[{k:"foot_img_left",l:"Left Foot"},{k:"foot_img_right",l:"Right Foot"}]},
  ],
  inventory:[
    {t:"Pair Info",f:[{k:"image_url",l:"Photo"},{k:"id",l:"DB #"},{k:"type",l:"Shoe Type"},{k:"color",l:"Color"},{k:"size",l:"Size"},{k:"farma_id",l:"Farma / Last"}]},
    {t:"Status",f:[{k:"finish_status",l:"Finish Status"},{k:"status",l:"Stock Status"},{k:"location_storage",l:"Storage Location"},{k:"date_added",l:"Date Added"},{k:"content_available",l:"Content Available"}]},
  ],
  uppers:[
    {t:"Upper Info",f:[{k:"image_url",l:"Photo"},{k:"id",l:"DB #"},{k:"style",l:"Style"},{k:"size",l:"Size"},{k:"farma_id",l:"Farma / Last"}]},
    {t:"Materials",f:[{k:"upper_leather_id",l:"Upper Leather Used"},{k:"lining_leather_id",l:"Lining Leather Used"},{k:"inspiration_id",l:"Inspiration Reference"}]},
    {t:"Readiness",f:[{k:"date_made",l:"Date Made"},{k:"made_by",l:"Made By"},{k:"status",l:"Status"},{k:"available",l:"Available"},{k:"paitava_available",l:"Paitawa Available"},{k:"stock_or_order",l:"Stock or Order"}]},
    {t:"Notes",f:[{k:"notes",l:"Notes"},{k:"quality_video_url",l:"Quality Video URL"}]},
  ],
  upper_leather:[
    {t:"Leather Info",f:[{k:"image_url",l:"Photo"},{k:"video_url",l:"Video Upload"},{k:"id",l:"Leather #"},{k:"type_pattern",l:"Type / Pattern"},{k:"color",l:"Color"},{k:"status",l:"Status"},{k:"size_unit_sqft",l:"Size (Sq Ft)"},{k:"procurement_date",l:"Procurement Date"},{k:"notes",l:"Notes"}]},
  ],
  farma:[
    {t:"Farma / Last Info",f:[{k:"image_url",l:"Photo"},{k:"id",l:"Farma #"},{k:"option_no",l:"Farma Code"},{k:"size",l:"Size / Use"},{k:"notes",l:"Notes"}]},
  ],
  lining_leather:[
    {t:"Lining Leather",f:[{k:"image_url",l:"Photo"},{k:"video_url",l:"Video Upload"},{k:"id",l:"Lining #"},{k:"color",l:"Color"},{k:"size",l:"Size (Sq Ft)"},{k:"status",l:"Status"},{k:"date_purchased",l:"Date Purchased"},{k:"notes",l:"Notes"}]},
  ],
  elastic:[
    {t:"Elastic",f:[{k:"image_url",l:"Photo"},{k:"id",l:"Elastic #"},{k:"color",l:"Color"},{k:"width",l:"Width"},{k:"size_meters",l:"Meters"},{k:"elastic_status",l:"Status"},{k:"notes",l:"Notes"}]},
  ],
  buckles:[
    {t:"Buckle",f:[{k:"image_url",l:"Photo"},{k:"video_url",l:"Video Upload"},{k:"id",l:"Buckle #"},{k:"color",l:"Color"},{k:"quantity",l:"Quantity"},{k:"status",l:"Status"},{k:"notes",l:"Notes"}]},
  ],
  laces:[
    {t:"Laces",f:[{k:"image_url",l:"Photo"},{k:"id",l:"Lace #"},{k:"color",l:"Color"},{k:"lace_type",l:"Lace Type"},{k:"size",l:"Size"},{k:"quantity",l:"Total Qty"},{k:"quantity_left",l:"Qty Left"},{k:"status",l:"Status"},{k:"notes",l:"Notes"}]},
  ],
  heels:[
    {t:"Heel",f:[{k:"image_url",l:"Photo"},{k:"id",l:"Heel #"},{k:"heel_type",l:"Heel Type"},{k:"heel_thickness",l:"Thickness"},{k:"heel_thickness_type",l:"Thickness Type"},{k:"notes",l:"Notes"}]},
  ],
  heel_tops:[
    {t:"Heel Top (Tapi)",f:[{k:"image_url",l:"Photo"},{k:"id",l:"Tapi #"},{k:"heel_top_type",l:"Type"},{k:"thickness_mm",l:"Thickness"},{k:"heel_top_status",l:"Status"},{k:"date_added",l:"Date Added"},{k:"notes",l:"Notes"}]},
  ],  sooti:[
    {t:"Sooti / Welt",f:[{k:"image_url",l:"Photo"},{k:"id",l:"Sooti #"},{k:"welt_type",l:"Welt Type"},{k:"sooti_color",l:"Color"},{k:"quantity_inches",l:"Quantity Inches"},{k:"sooti_status",l:"Status"},{k:"date_purchased",l:"Date Purchased"},{k:"notes",l:"Notes"}]},
  ],
  thread:[
    {t:"Thread",f:[{k:"image_url",l:"Photo"},{k:"id",l:"Thread #"},{k:"color",l:"Color"},{k:"thread_type",l:"Type"},{k:"use_for",l:"Use For"},{k:"thread_status",l:"Status"},{k:"date_received",l:"Date Received"},{k:"notes",l:"Notes"}]},
  ],
  belts:[
    {t:"Belt Info",f:[{k:"image_url",l:"Photo"},{k:"id",l:"DB #"},{k:"belt_name",l:"Belt Name"},{k:"size_inches",l:"Size"},{k:"color",l:"Color"},{k:"style_type",l:"Style / Type"},{k:"quantity",l:"Quantity"},{k:"unit_price",l:"Unit Price"},{k:"production_date",l:"Production Date"},{k:"status",l:"Status"},{k:"notes",l:"Notes"}]},
    {t:"Materials",f:[{k:"upper_leather_id",l:"Leather Used"},{k:"buckle_id",l:"Buckle Used"},{k:"matching_upper",l:"Matching Upper Ref"}]},
  ],
  production:[
    {t:"Design",f:[{k:"id",l:"DB #"},{k:"design_name",l:"Design Name"},{k:"inspiration_id",l:"Inspiration"},{k:"farma_option",l:"Farma Option"},{k:"with_sooti",l:"With Sooti"},{k:"selected_leathers",l:"Selected Leathers"},{k:"number_of_pairs",l:"Number of Pairs"}]},
    {t:"Planning",f:[{k:"planned_date",l:"Planned Date"},{k:"priority",l:"Priority"},{k:"responsible_person",l:"Responsible Person"},{k:"status",l:"Status"},{k:"last_updated",l:"Last Updated"},{k:"notes",l:"Notes"}]},
    {t:"Materials",f:[{k:"buckle_id",l:"Linked Buckle"},{k:"sooti_welt_id",l:"Sooti/Welt"},{k:"finishing_id",l:"Finishing"},{k:"lining_leathers",l:"Lining Leathers (text)"},{k:"finishing_types",l:"Finishing Types (text)"},{k:"sooti_welt_types",l:"Sooti/Welt Types (text)"}]},
  ],
  faults:[
    {t:"Fault",f:[{k:"fault_image_url",l:"Fault Photo"},{k:"id",l:"DB #"},{k:"fault_area",l:"Fault Area"},{k:"fault_type",l:"Fault Type / Description"},{k:"is_critical",l:"Is Critical?"},{k:"fault_date",l:"Fault Date"},{k:"reported_by",l:"Reported By"},{k:"fault_status",l:"Status"}]},
    {t:"Resolution",f:[{k:"action_taken",l:"Action Taken"},{k:"resolution_date",l:"Resolution Date"},{k:"resolved_by",l:"Resolved By"},{k:"linked_material",l:"Linked Material"}]},
  ],
  tools:[
    {t:"Tool Info",f:[{k:"image_url",l:"Photo"},{k:"id",l:"DB #"},{k:"tool_name",l:"Tool Name"},{k:"tool_type",l:"Tool Type"},{k:"serial_number",l:"Serial #"},{k:"purchase_value",l:"Purchase Value"},{k:"current_condition",l:"Condition"}]},
    {t:"Assignment",f:[{k:"status",l:"Status"},{k:"assigned_to",l:"Assigned To"},{k:"assigned_date",l:"Assigned Date"},{k:"return_due_date",l:"Return Due"},{k:"actual_return_date",l:"Actual Return"},{k:"location_storage",l:"Storage Location"},{k:"responsible_person",l:"Responsible Person"},{k:"remarks",l:"Remarks"},{k:"tool_history",l:"Tool History"},{k:"theft_risk_assessment",l:"Theft Risk (AI)"}]},
  ],
  expenses:[
    {t:"Petty Cash Ledger",f:[{k:"receipt_url",l:"Receipt Photo"},{k:"id",l:"Entry #"},{k:"date",l:"Date"},{k:"expense_category",l:"Category"},{k:"description",l:"Description"},{k:"debit",l:"Debit"},{k:"credit",l:"Credit"},{k:"notes",l:"Notes"}]},
  ],
  income:[
    {t:"Income / Sales",f:[{k:"receipt_url",l:"Receipt Photo"},{k:"id",l:"Income #"},{k:"date_received",l:"Date"},{k:"customer_name",l:"Customer Name"},{k:"income_unit_type",l:"Unit Type"},{k:"unit_number",l:"Unit #"},{k:"amount_received",l:"Amount Received"},{k:"payment_type",l:"Payment Type"},{k:"payment_reference",l:"Reference / Notes"}]},
  ],
  putha:[
    {t:"Putha Sole Leather",f:[{k:"image_url",l:"Photo"},{k:"id",l:"Putha #"},{k:"name_type",l:"Weight"},{k:"putha_status",l:"Status"},{k:"date_purchased",l:"Purchased"},{k:"notes",l:"Notes"}]},
  ],
  laser_sole:[
    {t:"Leather Sole",f:[{k:"image_url",l:"Photo"},{k:"id",l:"Sole #"},{k:"size",l:"Size"},{k:"sole_thickness_type",l:"Thickness"},{k:"sole_design_type",l:"Type"},{k:"farma_id",l:"Farma"},{k:"sole_status",l:"Status"},{k:"laser_date",l:"Laser Date"},{k:"notes",l:"Notes"}]},
  ],
  rubber_laser:[
    {t:"Rubber Sole",f:[{k:"image_url",l:"Photo"},{k:"id",l:"Rubber #"},{k:"size",l:"Size"},{k:"farma_id",l:"Farma"},{k:"rubber_status",l:"Status"},{k:"notes",l:"Notes"}]},
  ],
  sole_sheets:[
    {t:"Sole Sheets",f:[{k:"image_url",l:"Photo"},{k:"id",l:"Sole Sheet #"},{k:"name",l:"Name / Type"},{k:"color",l:"Color"},{k:"thickness",l:"Thickness (Inch)"},{k:"size",l:"Size (Inches L×B)"},{k:"sole_sheet_status",l:"Status"},{k:"label",l:"Label"},{k:"notes",l:"Notes"}]},
  ],  mek:[
    {t:"MEK Sheet",f:[{k:"image_url",l:"Photo"},{k:"id",l:"MEK #"},{k:"thickness",l:"Thickness (MM)"},{k:"size",l:"Size (Inches L×B)"},{k:"mek_status",l:"Status"},{k:"date_purchased",l:"Date Purchased"},{k:"notes",l:"Notes"}]},
  ],
  finishing:[
    {t:"Dye Color",f:[{k:"image_url",l:"Photo"},{k:"id",l:"Dye #"},{k:"dye_color",l:"Exact Color Name"},{k:"dye_status",l:"Status"},{k:"notes",l:"Notes"}]},
  ],
  polish:[
    {t:"Shoe Polish",f:[{k:"image_url",l:"Photo"},{k:"id",l:"Polish #"},{k:"polish_color",l:"Color"},{k:"polish_company",l:"Company"},{k:"polish_type",l:"Type"},{k:"polish_weight_size",l:"Weight / Size"},{k:"polish_status",l:"Status"},{k:"notes",l:"Notes"}]},
  ],
  solution:[
    {t:"Solution",f:[{k:"id",l:"DB #"},{k:"name",l:"Solution Name"},{k:"quantity",l:"Quantity"},{k:"date_purchased",l:"Date Purchased"},{k:"quantity_deducted",l:"Qty Deducted"},{k:"deduction_date",l:"Deduction Date"},{k:"used_where",l:"Used Where"},{k:"notes",l:"Notes"}]},
  ],
  leather_board:[
    {t:"Leather Board",f:[{k:"image_url",l:"Photo"},{k:"id",l:"Leather Board #"},{k:"name_type",l:"Name / Type"},{k:"thickness",l:"Thickness (MM)"},{k:"leather_board_status",l:"Status"},{k:"notes",l:"Notes"}]},
  ],  knowledge:[
    {t:"Knowledge Entry",f:[{k:"id",l:"DB #"},{k:"knowledge_point",l:"Point / Title"},{k:"knowledge_category",l:"Category"},{k:"point_info",l:"Full Information"},{k:"attachment_url",l:"Attachment URL"}]},
  ],
  material_usage:[
    {t:"Usage Log",f:[{k:"id",l:"DB #"},{k:"work_order_id",l:"Work Order"},{k:"department",l:"Department"},{k:"work_order_type",l:"WO Type"},{k:"material_category",l:"Material Category"},{k:"material_table",l:"Material Table"},{k:"material_record_id",l:"Material Record ID"},{k:"material_name",l:"Material Name"},{k:"quantity_used",l:"Qty Used"},{k:"unit",l:"Unit"},{k:"usage_status",l:"Usage Status"},{k:"date_used",l:"Date Used"},{k:"used_by",l:"Used By"},{k:"notes",l:"Notes"}]},
  ],
  sops:[
    {t:"SOP",f:[{k:"image_url",l:"Photo"},{k:"id",l:"SOP #"},{k:"rule_category",l:"Category"},{k:"rule_description",l:"Description"}]},
  ],
  rules:[
    {t:"Rule Book",f:[{k:"image_url",l:"Photo"},{k:"id",l:"Rule #"},{k:"rule_category",l:"Category"},{k:"rule_description",l:"Description"},{k:"is_active",l:"Is Active?"}]},
  ],
  inspiration:[
    {t:"Reference",f:[{k:"image_url",l:"Reference Image"},{k:"id",l:"Inspiration #"}]},
    {t:"Design Classification",f:[{k:"type_of_inspiration",l:"Type of Inspiration"},{k:"design_type",l:"Design Type / Shoe Style"},{k:"toe_shape",l:"Toe / Shape"},{k:"closure_type",l:"Closure / Hardware"}]},
    {t:"AI / RAG Notes",f:[{k:"tags",l:"Search Tags"},{k:"design_elements",l:"Reusable Design Elements"},{k:"construction_notes",l:"Making / Construction Notes"},{k:"ai_search_summary",l:"AI Search Summary"},{k:"inspiration_status",l:"RAG Status"},{k:"notes",l:"Notes / Ideas"}]},
  ],
  patterns:[
    {t:"Pattern Reference",f:[{k:"image_url",l:"Pattern Image"},{k:"id",l:"Pattern #"},{k:"pattern_name",l:"Pattern Name / Type"}]},
    {t:"AI / RAG Notes",f:[{k:"best_use",l:"Best Use"},{k:"avoid_use",l:"Avoid Use"},{k:"design_notes",l:"Design / Making Notes"},{k:"ai_search_summary",l:"AI Search Summary"},{k:"laser_pattern_status",l:"RAG Status"},{k:"description",l:"Description"}]},
  ],
  videos:[
    {t:"Video",f:[{k:"video_url",l:"Video Upload"},{k:"id",l:"DB #"},{k:"upload_date",l:"Upload Date"},{k:"video_type",l:"Video Type"},{k:"status",l:"Status"},{k:"tags",l:"Tags"},{k:"notes",l:"Notes"}]},
    {t:"Links",f:[{k:"upper_id",l:"Related Upper"},{k:"related_pair_id",l:"Related Pair"},{k:"work_order_id",l:"Related Work Order"},{k:"customer_id",l:"Related Customer"}]},
  ],
  extra_saman:[
    {t:"Extra Saman",f:[{k:"image_url",l:"Photo"},{k:"video_url",l:"Video Upload"},{k:"id",l:"DB #"},{k:"serial_number",l:"Serial #"},{k:"name",l:"Name"},{k:"usage",l:"Usage"},{k:"material_type",l:"Material Type"},{k:"location_storage",l:"Location"},{k:"quantity",l:"Quantity"},{k:"notes",l:"Notes"}]},
  ],
};

// ── Column configs for list view ─────────────────────────────
const ID={k:"id",l:"#",w:50,t:"id"};
const IMG={k:"image_url",t:"img",w:52};
const COLS={
  work_orders:[{k:"wo_number",l:"WO #",w:80,t:"wo_num"},{k:"representative_image_url",l:"Image",t:"img",w:52},{k:"type_dept",l:"Type / Dept",w:150,t:"type_dept"},{k:"work_order_status",l:"Work Status",w:130,t:"badge"},{k:"assigned_to",l:"Assigned",w:115},{k:"stock_or_order",l:"Stock / Order",w:105,t:"badge"},{k:"quality_status",l:"Quality",w:115,t:"quality_status"}],
  customers:[{k:"id",l:"Customer #",w:88,t:"customer_num"},IMG,{k:"customer_name",l:"Name",w:150},{k:"country",l:"Country",w:85},{k:"source",l:"Source",w:85},{k:"phone_number",l:"Phone",w:120},{k:"customer_size_mode",l:"Size Type",w:135,t:"size_mode"},{k:"delivery_status",l:"Status",w:110,t:"badge"}],
  measurements:[{k:"id",l:"Measurement #",w:115,t:"measurement_num"},{k:"customer_name",l:"Customer",w:160},{k:"customer_size_mode",l:"Size Type",w:135,t:"size_mode"},{k:"size",l:"Size",w:85},{k:"unit",l:"Unit",w:90},{k:"point_a",l:"A",w:55},{k:"point_b",l:"B",w:55},{k:"point_c",l:"C",w:55}],
  inventory:[{k:"id",l:"Pair #",w:82,t:"pair_num"},{k:"image_url",l:"Image",t:"img",w:52},{k:"type",l:"Type",w:95},{k:"color",l:"Color",w:85},{k:"size",l:"Size",w:55},{k:"farma_id",l:"Farma",w:75},{k:"finish_status",l:"Finish Status",w:130,t:"badge"},{k:"status",l:"Stock Status",w:110,t:"badge"},{k:"location_storage",l:"Location",w:90},{k:"date_added",l:"Added",w:90,t:"date"},{k:"content_available",l:"Content",w:85,t:"bool"}],
  uppers:[{k:"id",l:"Upper #",w:85,t:"upper_num"},IMG,{k:"style",l:"Style",w:100},{k:"size",l:"Size",w:65},{k:"farma_id",l:"Farma",w:100,t:"farma_label"},{k:"date_made",l:"Made Date",w:95,t:"date"},{k:"made_by",l:"Made By",w:110},{k:"status",l:"Status",w:95,t:"badge"},{k:"available",l:"Available",w:85,t:"bool"},{k:"paitava_available",l:"Paitawa",w:85,t:"bool"},{k:"stock_or_order",l:"Stock / Order",w:105,t:"badge"}],
  upper_leather:[{k:"id",l:"Leather #",w:88,t:"leather_num"},IMG,{k:"video_url",l:"Video",w:58,t:"video"},{k:"type_pattern",l:"Type / Pattern",w:150,t:"badge"},{k:"color",l:"Color",w:120,t:"leather_color"},{k:"size_unit_sqft",l:"Sq Ft",w:70},{k:"status",l:"Status",w:95,t:"badge"},{k:"procurement_date",l:"Procured",w:95,t:"date"},{k:"notes",l:"Notes",w:180}],
  farma:[{k:"id",l:"Farma #",w:82,t:"farma_num"},IMG,{k:"option_no",l:"Farma Code",w:115,t:"farma_label"},{k:"option_no",l:"Last Type",w:130,t:"farma_shape"},{k:"size",l:"Size / Use",w:120},{k:"notes",l:"Notes",w:220}],
  lining_leather:[{k:"id",l:"Lining #",w:88,t:"lining_num"},IMG,{k:"video_url",l:"Video",w:58,t:"video"},{k:"color",l:"Color",w:120,t:"leather_color"},{k:"size",l:"Sq Ft",w:80},{k:"status",l:"Status",w:95,t:"badge"},{k:"date_purchased",l:"Purchased",w:95,t:"date"}],
  elastic:[{k:"id",l:"Elastic #",w:88,t:"elastic_num"},IMG,{k:"color",l:"Color",w:130,t:"leather_color"},{k:"width",l:"Width",w:90},{k:"size_meters",l:"Meters",w:90},{k:"status",l:"Status",w:95,t:"badge"}],
  buckles:[{k:"id",l:"Buckle #",w:88,t:"buckle_num"},IMG,{k:"video_url",l:"Video",w:58,t:"video"},{k:"color",l:"Color",w:130,t:"buckle_color"},{k:"quantity",l:"Qty",w:70},{k:"status",l:"Status",w:95,t:"badge"}],
  laces:[{k:"id",l:"Lace #",w:82,t:"lace_num"},IMG,{k:"color",l:"Color",w:135,t:"lace_color"},{k:"lace_type",l:"Type",w:95,t:"badge"},{k:"quantity",l:"Total Qty",w:80},{k:"quantity_left",l:"Qty Left",w:80},{k:"size",l:"Size",w:105},{k:"status",l:"Status",w:95,t:"badge"}],
  heels:[{k:"id",l:"Heel #",w:82,t:"heel_num"},IMG,{k:"heel_type",l:"Heel Type",w:125,t:"badge"},{k:"thickness",l:"Thickness",w:105,t:"badge"},{k:"thickness_type",l:"Thickness Type",w:125,t:"badge"}],
  heel_tops:[{k:"id",l:"Tapi #",w:82,t:"tapi_num"},IMG,{k:"type",l:"Type",w:150,t:"badge"},{k:"thickness_mm",l:"Thickness",w:105},{k:"status",l:"Status",w:120,t:"badge"}],
  sooti:[{k:"id",l:"Sooti #",w:82,t:"sooti_num"},IMG,{k:"welt_type",l:"Welt Type",w:150,t:"badge"},{k:"color",l:"Color",w:120,t:"leather_color"},{k:"quantity_inches",l:"Inches",w:80},{k:"status",l:"Status",w:115,t:"badge"},{k:"date_purchased",l:"Purchased",w:95,t:"date"}],
  thread:[{k:"id",l:"Thread #",w:88,t:"thread_num"},IMG,{k:"color",l:"Color",w:130,t:"leather_color"},{k:"type",l:"Type",w:110,t:"badge"},{k:"use_for",l:"Use For",w:90,t:"badge"},{k:"status",l:"Status",w:100,t:"badge"},{k:"date_received",l:"Received",w:95,t:"date"}],
  belts:[ID,IMG,{k:"belt_name",l:"Name",w:130},{k:"size_inches",l:"Size",w:60},{k:"color",l:"Color",w:95},{k:"quantity",l:"Qty",w:50},{k:"unit_price",l:"Price",w:75,t:"money"},{k:"status",l:"Status",w:90,t:"badge"}],
  production:[ID,{k:"design_name",l:"Design",w:155},{k:"farma_option",l:"Farma",w:75},{k:"number_of_pairs",l:"Pairs",w:50},{k:"planned_date",l:"Planned",w:90,t:"date"},{k:"priority",l:"Priority",w:85,t:"badge"},{k:"status",l:"Status",w:100,t:"badge"}],
  faults:[ID,{k:"fault_image_url",t:"img",w:52},{k:"fault_area",l:"Area",w:90},{k:"fault_type",l:"Type",w:140},{k:"is_critical",l:"Critical",w:70,t:"bool"},{k:"fault_date",l:"Date",w:90,t:"date"},{k:"fault_status",l:"Status",w:95,t:"badge"}],
  tools:[ID,IMG,{k:"tool_name",l:"Tool",w:120},{k:"tool_type",l:"Type",w:95},{k:"current_condition",l:"Condition",w:95},{k:"status",l:"Status",w:90,t:"badge"},{k:"assigned_to",l:"Assigned",w:100}],
  expenses:[{k:"id",l:"Entry #",w:82,t:"expense_num"},{k:"receipt_url",l:"Receipt",t:"img",w:58},{k:"date",l:"Date",w:95,t:"date"},{k:"expense_category",l:"Category",w:135,t:"badge"},{k:"description",l:"Description",w:210},{k:"debit",l:"Debit",w:95,t:"money"},{k:"credit",l:"Credit",w:95,t:"money"}],
  income:[{k:"id",l:"Income #",w:88,t:"income_num"},{k:"receipt_url",l:"Receipt",t:"img",w:58},{k:"date_received",l:"Date",w:95,t:"date"},{k:"customer_name",l:"Customer",w:145},{k:"unit_type",l:"Unit Type",w:115,t:"badge"},{k:"unit_number",l:"Unit #",w:105},{k:"amount_received",l:"Amount",w:105,t:"money"},{k:"payment_type",l:"Payment Type",w:120,t:"badge"}],
  knowledge:[ID,{k:"knowledge_point",l:"Point",w:170},{k:"knowledge_category",l:"Category",w:140},{k:"point_info",l:"Info",w:280}],
  material_usage:[ID,{k:"work_order_id",l:"WO",w:70},{k:"department",l:"Dept",w:90,t:"badge"},{k:"work_order_type",l:"WO Type",w:115,t:"badge"},{k:"material_category",l:"Category",w:90,t:"badge"},{k:"material_table",l:"Table",w:125},{k:"material_record_id",l:"Record",w:70},{k:"quantity_used",l:"Qty",w:60,t:"num"},{k:"unit",l:"Unit",w:70},{k:"usage_status",l:"Status",w:90,t:"badge"},{k:"date_used",l:"Date",w:90,t:"date"}],
  sops:[{k:"id",l:"SOP #",w:82,t:"sop_num"},IMG,{k:"rule_category",l:"Category",w:125,t:"badge"},{k:"rule_description",l:"Description",w:420}],
  rules:[{k:"id",l:"Rule #",w:82,t:"rule_num"},IMG,{k:"rule_category",l:"Category",w:125,t:"badge"},{k:"rule_description",l:"Description",w:360},{k:"is_active",l:"Active",w:80,t:"bool"}],
  inspiration:[{k:"id",l:"Inspiration #",w:118,t:"inspiration_num"},IMG,{k:"type_of_inspiration",l:"Type",w:135,t:"badge"},{k:"design_type",l:"Design Type / Shoe Style",w:170,t:"badge"},{k:"tags",l:"Tags",w:160},{k:"inspiration_status",l:"RAG Status",w:125,t:"badge"}],
  patterns:[{k:"id",l:"Pattern #",w:90,t:"pattern_num"},IMG,{k:"pattern_name",l:"Pattern Name / Type",w:230,t:"badge"},{k:"best_use",l:"Best Use",w:240},{k:"laser_pattern_status",l:"RAG Status",w:125,t:"badge"}],
  videos:[ID,{k:"video_url",l:"Video",w:58,t:"video"},{k:"upload_date",l:"Date",w:90,t:"date"},{k:"video_type",l:"Type",w:120,t:"badge"},{k:"status",l:"Status",w:95,t:"badge"},{k:"upper_id",l:"Upper",w:75},{k:"related_pair_id",l:"Pair",w:75},{k:"work_order_id",l:"WO",w:75},{k:"customer_id",l:"Customer",w:90},{k:"tags",l:"Tags",w:140}],
  putha:[{k:"id",l:"Putha #",w:82,t:"putha_num"},IMG,{k:"name_type",l:"Weight",w:105},{k:"status",l:"Status",w:105,t:"badge"},{k:"date_purchased",l:"Purchased",w:95,t:"date"}],
  laser_sole:[{k:"id",l:"Sole #",w:82,t:"sole_num"},IMG,{k:"size",l:"Size",w:70},{k:"thickness",l:"Thickness",w:95,t:"badge"},{k:"type",l:"Type",w:85,t:"badge"},{k:"farma_id",l:"Farma",w:100,t:"farma_label"},{k:"status",l:"Status",w:115,t:"badge"},{k:"laser_date",l:"Laser Date",w:95,t:"date"}],
  rubber_laser:[{k:"id",l:"Rubber #",w:88,t:"rubber_num"},IMG,{k:"size",l:"Size",w:70},{k:"farma_id",l:"Farma",w:100,t:"farma_label"},{k:"status",l:"Status",w:105,t:"badge"}],
  sole_sheets:[{k:"id",l:"Sole Sheet #",w:98,t:"sole_sheet_num"},IMG,{k:"name",l:"Name / Type",w:170},{k:"color",l:"Color",w:120,t:"leather_color"},{k:"thickness",l:"Thickness (Inch)",w:120,t:"badge"},{k:"size",l:"Size (Inches L×B)",w:145},{k:"status",l:"Status",w:115,t:"badge"}],
  mek:[{k:"id",l:"MEK #",w:82,t:"mek_num"},IMG,{k:"thickness",l:"Thickness (MM)",w:125,t:"badge"},{k:"size",l:"Size (Inches L×B)",w:145},{k:"status",l:"Status",w:115,t:"badge"}],
  finishing:[{k:"id",l:"Dye #",w:82,t:"dye_num"},IMG,{k:"color",l:"Exact Color",w:160,t:"leather_color"},{k:"status",l:"Status",w:110,t:"badge"}],
  polish:[{k:"id",l:"Polish #",w:88,t:"polish_num"},IMG,{k:"color",l:"Color",w:115,t:"leather_color"},{k:"company",l:"Company",w:125,t:"badge"},{k:"type",l:"Type",w:90,t:"badge"},{k:"weight_size",l:"Weight / Size",w:120},{k:"status",l:"Status",w:110,t:"badge"}],
  solution:[ID,{k:"name",l:"Name",w:180},{k:"quantity",l:"Qty",w:75},{k:"date_purchased",l:"Purchased",w:95,t:"date"},{k:"used_where",l:"Used For",w:110}],
  leather_board:[{k:"id",l:"Leather Board #",w:118,t:"leather_board_num"},IMG,{k:"name_type",l:"Name / Type",w:180},{k:"status",l:"Status",w:115,t:"badge"}],
  extra_saman:[ID,IMG,{k:"video_url",l:"Video",w:52,t:"video"},{k:"name",l:"Name",w:150},{k:"usage",l:"Usage",w:110,t:"badge"},{k:"material_type",l:"Material",w:120,t:"badge"},{k:"location_storage",l:"Location",w:100},{k:"quantity",l:"Qty",w:60,t:"num"},{k:"notes",l:"Notes",w:190}],
};

// ── CSV Import Screen ───────────────────────────────────────
function parseCSVText(text){
  const rows=[];let row=[];let cur="";let q=false;
  for(let i=0;i<text.length;i++){
    const ch=text[i],nx=text[i+1];
    if(ch==='"'){
      if(q&&nx==='"'){cur+='"';i++;}
      else q=!q;
    }else if(ch===","&&!q){row.push(cur);cur="";}
    else if((ch==="\n"||ch==="\r")&&!q){
      if(ch==="\r"&&nx==="\n")i++;
      row.push(cur);cur="";
      if(row.some(v=>String(v).trim()!==""))rows.push(row);
      row=[];
    }else cur+=ch;
  }
  row.push(cur);
  if(row.some(v=>String(v).trim()!==""))rows.push(row);
  if(!rows.length)return{headers:[],rows:[]};
  const headers=rows[0].map(h=>String(h||"").trim());
  return{headers,rows:rows.slice(1).map(r=>Object.fromEntries(headers.map((h,i)=>[h,r[i]??""])))};
}
function normKey(v){return String(v||"").toLowerCase().replace(/&/g,"and").replace(/[^a-z0-9]+/g,"_").replace(/^_+|_+$/g,"");}
function extractFirstUrl(v){const s=String(v||"");const m=s.match(/https?:\/\/[^\s,)]+/);return m?m[0]:s.trim();}
function toISODate(v){
  const s=String(v||"").trim();if(!s)return null;
  if(/^\d{4}-\d{2}-\d{2}/.test(s))return s.slice(0,10);
  const m=s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if(m){let y=m[3].length===2?`20${m[3]}`:m[3];return `${y}-${String(m[1]).padStart(2,"0")}-${String(m[2]).padStart(2,"0")}`;}
  const d=new Date(s);return Number.isNaN(d.getTime())?s:d.toISOString().slice(0,10);
}
function cleanImportValue(v,field){
  const raw=String(v??"").trim();if(raw==="")return null;
  if(field.t==="img"||field.t==="video")return extractFirstUrl(raw);
  if(field.t==="bool")return /^(yes|true|1|done|active|available)$/i.test(raw);
  if(field.t==="num"||["money"].includes(field.t)){const n=Number(raw.replace(/[^0-9.\-]/g,""));return Number.isFinite(n)?n:null;}
  if(field.t==="date")return toISODate(raw);
  if(field.k==="id")return null;
  return raw;
}
function fieldListForMod(modId){
  const sec=(SECTIONS[modId]||[]).flatMap(s=>s.f||[]);
  const col=(COLS[modId]||[]).map(c=>({k:c.k,l:c.l||c.k,t:c.t}));
  const seen=new Set();
  return [...sec,...col].map(f=>resolveField(f.k,f.l||f.k)).filter(f=>{
    if(!f.k||seen.has(f.k)||f.k==="id")return false;seen.add(f.k);return true;
  });
}
function guessField(header,fields){
  const h=normKey(header);
  const alias={
    photo:"image_url",picture:"image_url",image:"image_url",reference_images:"image_url",reference_image:"image_url",fault:"fault_image_url",receipt:"receipt_url",
    db:"id",db_number:"id",db_no:"id",entry:"entry_number",entry_number:"entry_number",
    customer:"customer_name",customer_name:"customer_name",name:"name",full_name:"customer_name",
    amount:"amount_received",amount_received:"amount_received",payment:"payment_type",payment_type:"payment_type",date_received:"date_received",
    type_of_inspiration:"type_of_inspiration",design_type:"design_type",tag:"tags",tags:"tags",
    point:"knowledge_point",category:"knowledge_category",knowledge_category:"knowledge_category",info:"point_info",
    rule:"rule_number",rule_number:"rule_number",description:"rule_description",
    fault_area:"fault_area",fault_type_description:"fault_type",fault_type:"fault_type",is_critical_fault:"is_critical",critical:"is_critical",fault_status:"fault_status",
    heel_id:"id",heel_type:"heel_type",type_thickness:"thickness_type",thickness_type:"thickness_type",
    rubber_heel_top_id:"id",heel_top_id:"id",serial_no:"serial_no",serial:"serial_no",quantity_in_pairs:"quantity_in_pairs",date_added:"date_added",thickness_mm:"thickness_mm",
    stock_count:"stock_count",serial_number:"serial_no",serial_no:"serial_no",farma:"farma_id",farma_number:"farma_id",size:"size",
    video:"video_url",video_upload:"video_url",upload_date:"upload_date",video_type:"video_type",status:"status",
    material_type:"material_type",usage:"usage",location:"location_storage",location_storage:"location_storage",qty:"quantity",quantity:"quantity",
    unit_type:"unit_type",date_purchased:"date_purchased",notes:"notes",color:"color",code:"code"
  };
  if(alias[h]&&fields.some(f=>f.k===alias[h]))return alias[h];
  let exact=fields.find(f=>normKey(f.k)===h||normKey(f.l)===h);if(exact)return exact.k;
  return "";
}
function ImportScreen({tok,onImported}){
  const mods=ALL_NAV.filter(i=>TABLE_MAP[i.id]&&!i.id.startsWith("__"));
  const[startMod,setStartMod]=useState("work_orders");
  const[fileName,setFileName]=useState("");
  const[headers,setHeaders]=useState([]);
  const[rows,setRows]=useState([]);
  const[mapping,setMapping]=useState({});
  const[busy,setBusy]=useState(false);
  const[msg,setMsg]=useState("");
  const fields=fieldListForMod(startMod);
  const onFile=e=>{
    const f=e.target.files?.[0];if(!f)return;
    setFileName(f.name);setMsg("");
    const r=new FileReader();
    r.onload=ev=>{
      const parsed=parseCSVText(String(ev.target.result||""));
      setHeaders(parsed.headers);setRows(parsed.rows);
      const next={};parsed.headers.forEach(h=>{next[h]=guessField(h,fields);});
      setMapping(next);
    };
    r.readAsText(f);
    e.target.value="";
  };
  useEffect(()=>{if(!headers.length)return;const next={};headers.forEach(h=>{next[h]=mapping[h]&&fields.some(f=>f.k===mapping[h])?mapping[h]:guessField(h,fields);});setMapping(next);},[startMod]);
  const preview=rows.slice(0,5);
  const mappedCount=headers.filter(h=>mapping[h]).length;
  const importNow=async()=>{
    if(!rows.length){setMsg("Upload a CSV first.");return;}
    const table=TABLE_MAP[startMod];
    const fieldByKey=Object.fromEntries(fields.map(f=>[f.k,f]));
    const records=rows.map(r=>{
      const rec={};
      headers.forEach(h=>{
        const key=mapping[h];if(!key||key==="id")return;
        const f=fieldByKey[key]||resolveField(key,key);
        const val=cleanImportValue(r[h],f);
        if(val!==null&&val!==undefined&&val!=="")rec[key]=val;
      });
      return rec;
    }).filter(r=>Object.keys(r).length>0);
    if(!records.length){setMsg("No mapped fields to import.");return;}
    setBusy(true);setMsg("");
    try{
      let done=0;
      for(let i=0;i<records.length;i+=100){
        const chunk=records.slice(i,i+100);
        const res=await fetch(`${SB_URL}/rest/v1/${table}`,{method:"POST",headers:{apikey:SB_KEY,Authorization:`Bearer ${tok}`,"Content-Type":"application/json",Prefer:"return=minimal"},body:JSON.stringify(chunk)});
        if(!res.ok){const j=await res.json().catch(()=>null);throw new Error(j?.message||j?.details||`Import failed: ${res.status}`);}
        done+=chunk.length;
      }
      setMsg(`Imported ${done} records into ${mods.find(m=>m.id===startMod)?.l||startMod}.`);
      onImported?.(startMod);
    }catch(e){console.error(e);setMsg(`Import failed: ${e.message||e}`);}finally{setBusy(false);}
  };
  return <div style={{height:"100%",overflow:"auto",padding:24,background:C.bg}}>
    <div style={{background:C.card,border:`1px solid ${C.border}`,padding:22,maxWidth:1180,margin:"0 auto"}}>
      <div style={{display:"flex",alignItems:"flex-start",gap:16,marginBottom:18}}>
        <div style={{width:42,height:42,background:C.accentD,display:"flex",alignItems:"center",justifyContent:"center",border:`1px solid ${C.border}`}}><i className="ti ti-database-import" style={{fontSize:22,color:C.accent}}/></div>
        <div style={{flex:1}}><h2 style={{margin:"0 0 4px",fontSize:24}}>Import CSV Data</h2><p style={{margin:0,color:C.sub,fontSize:13}}>Upload a CSV, choose the destination table, review field mapping, then import records into Supabase.</p></div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:16}}>
        <div><label style={{fontSize:11,fontWeight:800,letterSpacing:".12em",color:C.sub,textTransform:"uppercase",display:"block",marginBottom:6}}>Destination Table</label><select value={startMod} onChange={e=>setStartMod(e.target.value)} style={C.inp}>{mods.map(m=><option key={m.id} value={m.id}>{m.l}</option>)}</select></div>
        <div><label style={{fontSize:11,fontWeight:800,letterSpacing:".12em",color:C.sub,textTransform:"uppercase",display:"block",marginBottom:6}}>CSV File</label><label style={{...C.inp,display:"flex",alignItems:"center",gap:10,cursor:"pointer"}}><i className="ti ti-upload"/> {fileName||"Choose CSV file"}<input type="file" accept=".csv,text/csv" onChange={onFile} style={{display:"none"}}/></label></div>
      </div>
      {headers.length>0&&<>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",borderTop:`1px solid ${C.border}`,paddingTop:16,marginTop:6}}>
          <div><b>{rows.length}</b> rows found · <b>{mappedCount}</b> columns mapped</div>
          <button onClick={importNow} disabled={busy} style={{background:C.accent,border:"none",padding:"10px 18px",fontWeight:800,cursor:busy?"not-allowed":"pointer",color:"#111"}}>{busy?"Importing…":"Import Records"}</button>
        </div>
        <h3 style={{fontSize:13,letterSpacing:".1em",textTransform:"uppercase",color:C.sub,margin:"18px 0 10px"}}>Field Mapping</h3>
        <div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:10}}>{headers.map(h=><div key={h} style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,alignItems:"center",border:`1px solid ${C.border}`,padding:8}}><span style={{fontSize:12,color:C.sub,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{h}</span><select value={mapping[h]||""} onChange={e=>setMapping(m=>({...m,[h]:e.target.value}))} style={{...C.inp,padding:"7px 8px",fontSize:12}}><option value="">Do not import</option>{fields.map(f=><option key={f.k} value={f.k}>{f.l||f.k} ({f.k})</option>)}</select></div>)}</div>
        <h3 style={{fontSize:13,letterSpacing:".1em",textTransform:"uppercase",color:C.sub,margin:"18px 0 10px"}}>Preview</h3>
        <div style={{overflow:"auto",border:`1px solid ${C.border}`}}><table style={{borderCollapse:"collapse",width:"100%"}}><thead><tr>{headers.slice(0,8).map(h=><th key={h} style={{textAlign:"left",fontSize:11,color:C.sub,padding:8,borderBottom:`1px solid ${C.border}`,whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead><tbody>{preview.map((r,i)=><tr key={i}>{headers.slice(0,8).map(h=><td key={h} style={{fontSize:12,padding:8,borderBottom:`1px solid ${C.border}`,maxWidth:180,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{String(r[h]??"")}</td>)}</tr>)}</tbody></table></div>
      </>}
      {msg&&<div style={{marginTop:16,padding:12,border:`1px solid ${msg.startsWith("Import failed")?"#FCA5A5":C.border}`,background:msg.startsWith("Import failed")?"#FEF2F2":"#F0FDF4",color:msg.startsWith("Import failed")?"#B91C1C":"#166534",fontSize:13}}>{msg}</div>}
    </div>
  </div>;
}

// ── Small UI helpers ─────────────────────────────────────────
function badge(v){const s=(v||"").toString().toLowerCase();if(["available","in stock","completed","done","resolved","ready","laser done","pass","active","good"].some(x=>s.includes(x)))return C.badges.green;if(["transit","shipped","progress","hold","planning","draft","assigned","fair","move to production","move to laser","production","laser"].some(x=>s.includes(x)))return C.badges.amber;if(["open","critical","unfinish","overdue","fail","retired","poor"].some(x=>s.includes(x)))return C.badges.red;if(["pending","new","high"].some(x=>s.includes(x)))return C.badges.blue;return C.badges.gray;}
function Badge({v}){const b=badge(v);return <span style={{background:b.bg,color:b.c,padding:"2px 9px",borderRadius:0,fontSize:11,fontWeight:600,whiteSpace:"nowrap"}}>{v||"—"}</span>;}
function leatherColorHex(v){
  const s=String(v||"").toLowerCase().trim();
  if(!s)return C.dim;
  if(s.includes("multi"))return "linear-gradient(90deg,#6B3F24,#D2A45F,#1E3A8A,#111827)";
  const rules=[
    [/off\s*white|cream/,"#F3E7D0"],[/white/,"#FFFFFF"],[/charcoal/,"#374151"],[/grey|gray/,"#9CA3AF"],
    [/dark\s*brown/,"#3B1F12"],[/light\s*brown/,"#B98252"],[/suede\s*brown/,"#8B5E3C"],[/brown/,"#6B3F24"],
    [/walnut/,"#7B4F2A"],[/chestnut/,"#8A4B2A"],[/cognac/,"#A65F2B"],[/tan|camel/,"#C49A6C"],[/taupe/,"#8B7A6B"],[/beige/,"#D8C2A3"],[/natural/,"#D4B483"],
    [/oxblood/,"#4B0F1A"],[/burgundy|maroon/,"#6F1D1B"],[/red/,"#A7262A"],[/orange/,"#C65A1E"],[/yellow/,"#D6A400"],
    [/navy/,"#0F254E"],[/dark\s*blue/,"#1E3A8A"],[/light\s*blue/,"#93C5FD"],[/blue/,"#2563EB"],
    [/olive/,"#5F6F32"],[/green/,"#166534"],[/purple/,"#6D28D9"],[/pink/,"#D9469A"],
    [/gold/,"#C9A227"],[/silver/,"#BFC5CC"],[/black/,"#111827"]
  ];
  const hit=rules.find(([re])=>re.test(s));
  return hit?hit[1]:"#A3A3A3";
}
function inferLeatherColorFromText(v){
  const s=String(v||"").toLowerCase();
  if(!s)return "";
  const rules=[
    [/light\s*brown/,"Light Brown"],[/dark\s*brown/,"Dark Brown"],[/plain\s*brown|brown/,"Brown"],
    [/walnut/,"Walnut"],[/chestnut/,"Chestnut"],[/cognac/,"Cognac"],[/tan|camel/,"Tan"],[/natural/,"Natural"],
    [/oxblood/,"Oxblood"],[/burgundy/,"Burgundy"],[/maroon|marron/,"Maroon"],[/red/,"Red"],
    [/navy/,"Navy Blue"],[/light\s*blue/,"Light Blue"],[/dark\s*blue/,"Dark Blue"],[/blue/,"Blue"],
    [/plain\s*black|black/,"Black"],[/charcoal/,"Charcoal"],[/grey|gray/,"Grey"],
    [/olive/,"Olive Green"],[/plain\s*green|green/,"Green"],[/cream/,"Cream"],[/off\s*white/,"Off White"],[/white|crust\s*white/,"White"],
    [/beige/,"Beige"],[/taupe/,"Taupe"],[/orange/,"Orange"],[/yellow/,"Yellow"],[/purple/,"Purple"],[/pink/,"Pink"],
    [/gold/,"Gold"],[/silver/,"Silver"],[/multi/,"Multi Color"]
  ];
  const hit=rules.find(([re])=>re.test(s));
  return hit?hit[1]:"";
}
function inferLeatherColor(row){
  return String(row?.color||"").trim()
    || inferLeatherColorFromText(row?.type_pattern)
    || inferLeatherColorFromText(row?.notes)
    || "";
}
function leatherColorMatches(row,target){
  if(!target)return true;
  const targetNorm=String(target||"").trim().toLowerCase();
  const exact=String(row?.color||"").toLowerCase().split(",").map(s=>s.trim()).filter(Boolean);
  const inferred=String(inferLeatherColor(row)||"").trim().toLowerCase();
  return exact.includes(targetNorm)||inferred===targetNorm;
}
function laceColorHex(v){
  const s=String(v||"").toLowerCase().trim();
  if(!s)return C.dim;
  if(s.includes("/")||s.includes("-")){
    const parts=s.split(/[\/\-]/).map(x=>x.trim()).filter(Boolean).slice(0,2);
    const colors=parts.map(p=>leatherColorHex(p));
    if(colors.length===2)return `linear-gradient(90deg,${colors[0]} 0 50%,${colors[1]} 50% 100%)`;
  }
  if(s.includes("kathai"))return "#8B5A2B";
  return leatherColorHex(v);
}
function laceColorMatches(row,target){
  if(!target)return true;
  const t=String(target||"").trim().toLowerCase();
  const vals=String(row?.color||"").toLowerCase().split(",").map(s=>s.trim()).filter(Boolean);
  return vals.some(v=>v===t);
}
function buckleColorHex(v){
  const s=String(v||"").toLowerCase().trim();
  if(!s)return C.dim;
  if(s.includes("black")&&s.includes("gold"))return "linear-gradient(90deg,#111827 0 50%,#C9A227 50% 100%)";
  if(s.includes("black")&&s.includes("chrome"))return "#2F343A";
  if(s.includes("silver")&&s.includes("chrome"))return "#C7CDD4";
  if(s.includes("golden")||s==="gold"||s.includes(" gold"))return "#C9A227";
  if(s.includes("antique")&&s.includes("brass"))return "#8A6A2A";
  if(s.includes("brass"))return "#B08D37";
  if(s.includes("gunmetal"))return "#4B5563";
  if(s.includes("copper"))return "#B87333";
  if(s.includes("rose"))return "#B76E79";
  if(s.includes("nickel"))return "#A7A9AC";
  if(s.includes("silver"))return "#BFC5CC";
  if(s.includes("black"))return "#111827";
  if(s.includes("brown"))return "#6B3F24";
  return leatherColorHex(v);
}
function buckleColorMatches(row,target){
  if(!target)return true;
  const t=String(target||"").trim().toLowerCase();
  const vals=String(row?.color||"").toLowerCase().split(",").map(s=>s.trim()).filter(Boolean);
  return vals.some(v=>v===t);
}
function farmaAliases(value){
  const v=String(value||"").trim().toLowerCase();
  const base={101:["101","1","farma 101","farma 1"],201:["201","2","farma 201","farma 2"],301:["301","3","farma 301","farma 3"],401:["401","4","farma 401","farma 4"],501:["501","5","farma 501","farma 5"],601:["601","6","farma 601","farma 6"],7:["7","7 ladies gol","7ladies gol","ladies gol","gol"],8:["8","8 ladies chauras","8ladies chauras","ladies chauras","chauras"]};
  return base[v]||[v];
}
function farmaShapeLabel(v){
  const raw=String(v||"").trim();
  const s=raw.toLowerCase();
  if(["101","201","301","401","501","601","1","2","3","4","5","6"].includes(s)) return "Men Last";
  if(s.includes("gol")||s==="7"||s==="7 ladies gol") return "Ladies Gol";
  if(s.includes("chauras")||s==="8"||s==="8 ladies chauras") return "Ladies Chauras";
  return raw||"—";
}
function farmaLabelValue(v){
  const s=String(v||"").trim();
  const n={1:"101",2:"201",3:"301",4:"401",5:"501",6:"601",7:"7 Ladies Gol",8:"8 Ladies Chauras"};
  return n[s]||s||"—";
}
function upperRowMatchesFarma(row,target){
  if(!target)return true;
  const vals=[row.farma_id,row.farma_option,row.farma,row.farma_no,row.farma_number,row.option_no]
    .map(v=>String(v||"").trim().toLowerCase()).filter(Boolean);
  const aliases=farmaAliases(target);
  return vals.some(v=>aliases.some(a=>v===a||v.includes(a)));
}

function Thumb({src,onClick,sz=40}){return src?<img src={src} onClick={onClick} alt="" style={{width:sz,height:sz,borderRadius:0,objectFit:"cover",cursor:onClick?"pointer":"default",border:`1px solid ${C.borderL}`,display:"block",flexShrink:0}}/>:<div style={{width:sz,height:sz,borderRadius:0,background:"#F3F3F1",border:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><i className="ti ti-camera" style={{fontSize:14,color:C.dim}}/></div>;}
function VideoThumb({src,sz=40,onClick}){return src?<div onClick={onClick} style={{width:sz,height:sz,borderRadius:0,position:"relative",overflow:"hidden",border:`1px solid ${C.borderL}`,background:"#000",display:"block",flexShrink:0,cursor:onClick?"pointer":"default"}}><video src={src} muted preload="metadata" style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/><span style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",background:"rgba(0,0,0,0.18)",fontSize:15}}>▶</span></div>:<div style={{width:sz,height:sz,borderRadius:0,background:"#F3F3F1",border:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><i className="ti ti-video" style={{fontSize:14,color:C.dim}}/></div>;}
function Cell({col,val,onImg}){
  if(col.t==="img")return <Thumb src={val} onClick={val?()=>onImg(val):undefined}/>;
  if(col.t==="video")return <VideoThumb src={val}/>;
  if(col.t==="id")return <span style={{color:C.dim,fontSize:12,fontFamily:"monospace"}}>{val||"—"}</span>;
  if(val===null||val===undefined||val==="")return <span style={{color:C.dim}}>—</span>;
  if(col.t==="date")return <span style={{color:C.sub,fontFamily:"monospace",fontSize:12}}>{String(val).split("T")[0]}</span>;
  if(col.t==="money")return <span style={{fontFamily:"monospace",fontSize:12,color:C.accentH}}>{Number(val).toLocaleString()}</span>;
  if(col.t==="badge"||col.t==="status_done")return <Badge v={col.t==="status_done"?(val?"Completed":"In Progress"):val}/>;
  if(col.t==="bool")return <span style={{color:val&&val!=="false"&&val!=="No"?C.ok:C.dim,fontSize:12}}>{val&&val!=="false"&&val!=="No"?"Yes":"No"}</span>;
  const s=String(val);return <span style={{color:C.text,fontSize:13}}>{s.length>55?s.slice(0,55)+"…":s}</span>;
}

function Uploader({value,onChange,label}){
  const ref=useRef();
  return <div>
    <div onClick={()=>ref.current.click()} onMouseEnter={e=>e.currentTarget.style.borderColor=C.accent} onMouseLeave={e=>e.currentTarget.style.borderColor=value?C.borderL:C.border}
      style={{width:"100%",height:value?160:80,borderRadius:0,border:`2px dashed ${value?C.borderL:C.border}`,cursor:"pointer",overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",background:C.card2,transition:"border-color .15s"}}>
      {value?<img src={value} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
       :<div style={{textAlign:"left",pointerEvents:"none"}}><i className="ti ti-cloud-upload" style={{fontSize:22,color:C.dim,display:"block",marginBottom:5}}/><span style={{color:C.dim,fontSize:12}}>{label||"Click to upload photo"}</span></div>}
    </div>
    {value&&<button onClick={()=>onChange(null)} style={{marginTop:4,background:"none",border:`1px solid ${C.border}`,color:C.dim,borderRadius:0,padding:"3px 10px",cursor:"pointer",fontSize:11}}>Remove</button>}
    <input ref={ref} type="file" accept="image/*" style={{display:"none"}} onChange={e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>onChange(ev.target.result);r.readAsDataURL(f);e.target.value="";}}/>
  </div>;
}

function VideoUploader({value,onChange,label}){
  const ref=useRef();
  return <div>
    <div onClick={()=>ref.current.click()} onMouseEnter={e=>e.currentTarget.style.borderColor=C.accent} onMouseLeave={e=>e.currentTarget.style.borderColor=value?C.borderL:C.border}
      style={{width:"100%",height:value?180:90,borderRadius:0,border:`2px dashed ${value?C.borderL:C.border}`,cursor:"pointer",overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",background:C.card2,transition:"border-color .15s"}}>
      {value?<video src={value} controls preload="metadata" style={{width:"100%",height:"100%",objectFit:"cover",background:"#000"}}/>
       :<div style={{textAlign:"left",pointerEvents:"none"}}><i className="ti ti-video-plus" style={{fontSize:24,color:C.dim,display:"block",marginBottom:5}}/><span style={{color:C.dim,fontSize:12}}>{label||"Click to upload video"}</span><span style={{display:"block",color:C.dim,fontSize:10,marginTop:4}}>Accepts video/* formats</span></div>}
    </div>
    {value&&<button onClick={()=>onChange(null)} style={{marginTop:4,background:"none",border:`1px solid ${C.border}`,color:C.dim,borderRadius:0,padding:"3px 10px",cursor:"pointer",fontSize:11}}>Remove video</button>}
    <input ref={ref} type="file" accept="video/*" style={{display:"none"}} onChange={e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>onChange(ev.target.result);r.readAsDataURL(f);e.target.value="";}}/>
  </div>;
}


function Lightbox({src,onClose}){return <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:2000,padding:20}}><img src={src} alt="" onClick={e=>e.stopPropagation()} style={{maxWidth:"90vw",maxHeight:"90vh",objectFit:"contain",borderRadius:0}}/><button onClick={onClose} style={{position:"absolute",top:16,right:16,background:"rgba(255,255,255,0.12)",border:"none",color:"#fff",borderRadius:0,padding:"7px 14px",cursor:"pointer"}}><i className="ti ti-x" style={{fontSize:17}}/></button></div>;}
function VideoLightbox({src,onClose}){return <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.86)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:2000,padding:20}}><video src={src} controls autoPlay onClick={e=>e.stopPropagation()} style={{maxWidth:"92vw",maxHeight:"88vh",background:"#000",borderRadius:0}}/><button onClick={onClose} style={{position:"absolute",top:16,right:16,background:"rgba(255,255,255,0.12)",border:"none",color:"#fff",borderRadius:0,padding:"7px 14px",cursor:"pointer"}}><i className="ti ti-x" style={{fontSize:17}}/></button></div>;}

// ── Related Select (linked record dropdown) ──────────────────
function relSelectCols(rel){
  return Array.from(new Set(["id",rel.display,rel.img,...(rel.fields||[])].filter(Boolean))).join(",");
}
function relLabel(rel,r){
  if(!r)return "";
  const main=rel.display?String(r[rel.display]||r.option_no||r.name||r.serial_no||r.size||"").trim():"";
  const extra=(rel.fields||[]).map(f=>r[f]).filter(v=>v!==null&&v!==undefined&&String(v).trim()!=="").join(" · ");
  const number=rel.showId?`${rel.prefix||"ID"} #${r.id}`:"";
  return [number,main,extra].filter(Boolean).join(" — ");
}
function RelSelect({fieldKey,label,rel,value,onChange,sbUrl,tok}){
  const[open,setOpen]=useState(false);
  const[recs,setRecs]=useState([]);
  const[q,setQ]=useState("");
  const[loading,setLoading]=useState(false);
  const ref=useRef();
  useEffect(()=>{
    if(!open&&!value)return;
    setLoading(true);
    fetch(`${sbUrl}/rest/v1/${rel.table}?select=${relSelectCols(rel)}&order=id.asc`,{headers:{"apikey":SB_KEY,"Authorization":`Bearer ${tok}`}})
      .then(async r=>{
        const rows=await r.json().catch(()=>null);
        if(r.ok&&Array.isArray(rows))return rows;
        // Fallback: if a display/image column name is missing in Supabase, still load linked records.
        const r2=await fetch(`${sbUrl}/rest/v1/${rel.table}?select=*&order=id.asc`,{headers:{"apikey":SB_KEY,"Authorization":`Bearer ${tok}`}});
        const rows2=await r2.json().catch(()=>null);
        return Array.isArray(rows2)?rows2:[];
      }).then(rows=>{setRecs(Array.isArray(rows)?rows:[]);}).catch(()=>{}).finally(()=>setLoading(false));
  },[open,value,rel.table,rel.display,rel.img]);
  useEffect(()=>{const h=e=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false);};document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h);},[]);
  const searchText=r=>[r.id,rel.display&&r[rel.display],rel.img&&r[rel.img],...(rel.fields||[]).map(f=>r[f])].filter(Boolean).join(" ").toLowerCase();
  const isAvailableUpperPicker=(fieldKey==="upper_id"&&/available upper|start bottom/i.test(label));
  const upperReadyScore=r=>{const st=String(r.status||"").toLowerCase();const av=r.available===true||r.available==="true"||r.available==="Yes"||r.available===1;return (av||st.includes("available")||st.includes("ready")||st.includes("in stock"))?0:1;};
  const baseList=isAvailableUpperPicker?[...recs].sort((a,b)=>upperReadyScore(a)-upperReadyScore(b)||Number(a.id||0)-Number(b.id||0)):recs;
  const filtered=q?baseList.filter(r=>searchText(r).includes(q.toLowerCase())):baseList;
  const sel=recs.find(r=>String(r.id)===String(value));
  const selLabel=sel?relLabel(rel,sel):value?`${rel.prefix||label} #${value}`:"";
  return <div ref={ref} style={{position:"relative"}}>
    <div onClick={()=>setOpen(o=>!o)} style={{...C.inp,display:"flex",alignItems:"center",gap:10,cursor:"pointer",padding:"8px 12px",minHeight:46}}>
      {sel&&rel.img?<Thumb src={sel[rel.img]} sz={34}/>:value&&rel.img?<Thumb sz={34}/>:null}
      <div style={{flex:1,minWidth:0}}>
        <span style={{display:"block",color:sel||value?C.text:C.dim,fontSize:13,fontWeight:sel?600:400,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{sel||value?selLabel:`Select ${label}…`}</span>
        {sel&&rel.showId&&<span style={{display:"block",color:C.dim,fontSize:11,marginTop:1}}>Connected record ID: {sel.id}</span>}
      </div>
      {value&&<button onClick={e=>{e.stopPropagation();onChange(null);}} style={{background:"none",border:"none",color:C.dim,cursor:"pointer",padding:0,fontSize:16}}>✕</button>}
      <i className={`ti ti-chevron-${open?"up":"down"}`} style={{fontSize:13,color:C.dim,flexShrink:0}}/>
    </div>
    {open&&<div style={{position:"absolute",top:"100%",left:0,right:0,background:"#FFFFFF",border:`1px solid ${C.borderL}`,borderRadius:0,zIndex:500,maxHeight:320,overflow:"hidden",display:"flex",flexDirection:"column",boxShadow:"0 4px 16px rgba(0,0,0,0.10)"}}>
      <div style={{padding:8,borderBottom:`1px solid ${C.border}`}}><input autoFocus value={q} onChange={e=>setQ(e.target.value)} placeholder={isAvailableUpperPicker?"Search upper by number, style, size, status…":"Search by number, style, size…"} style={{...C.inp,padding:"6px 10px",fontSize:12}}/></div>
      <div style={{overflowY:"auto",flex:1}}>
        {loading?<p style={{color:C.dim,fontSize:13,padding:12,margin:0}}>Loading…</p>
         :filtered.length===0?<p style={{color:C.dim,fontSize:13,padding:12,margin:0}}>No records found</p>
         :filtered.map(r=><div key={r.id} onClick={()=>{onChange(r.id);setOpen(false);setQ("");}}
            style={{display:"flex",alignItems:"center",gap:12,padding:"10px 12px",cursor:"pointer",background:String(value)===String(r.id)?C.accentD:"transparent",borderBottom:`1px solid ${C.border}`}}
            onMouseEnter={e=>e.currentTarget.style.background=C.card2} onMouseLeave={e=>e.currentTarget.style.background=String(value)===String(r.id)?C.accentD:"transparent"}>
            {rel.img&&<Thumb src={r[rel.img]} sz={44}/>} 
            <div style={{minWidth:0,flex:1}}><p style={{color:C.text,fontSize:14,fontWeight:String(value)===String(r.id)?700:500,margin:0,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{relLabel(rel,r)||"—"}</p><p style={{color:C.dim,fontSize:11,margin:"3px 0 0"}}>ID: {r.id}</p></div>
            {String(value)===String(r.id)&&<i className="ti ti-check" style={{fontSize:14,color:C.accent,marginLeft:"auto"}}/>}
          </div>)
        }
      </div>
    </div>}
  </div>;
}


// ── Form Field Renderer — uses FT registry globally ──────────
function FormField({fk,label,value,onChange,sbUrl,tok,allData}){
  const cfg=resolveField(fk,label);
  // id fields are read-only
  if(fk==="id"||fk==="balance_payment")
    return <div style={{...C.inp,color:C.dim,background:"transparent",border:`1px solid ${C.border}`,cursor:"not-allowed"}}>
      {fk==="balance_payment"&&allData?(()=>{const b=(Number(allData.total_sales_price)||0)-(Number(allData.advance_payment)||0);return b?`₨ ${b.toLocaleString()}`:"Auto-calculated";})():value||"—"}
    </div>;

  if(cfg.t==="img")  return <Uploader value={value} onChange={onChange} label={`Upload ${label}`}/>;
  if(cfg.t==="video")return <VideoUploader value={value} onChange={onChange} label={`Upload ${label}`}/>;
  if(cfg.t==="rel")  return <RelSelect fieldKey={fk} label={label} rel={cfg.rel} value={value} onChange={onChange} sbUrl={sbUrl} tok={tok}/>;
  // Some material inventory sizes are physical measurements, not shoe sizes. Allow free text for sheet inches and leather sq ft values.
  if(fk==="size" && /inch|sheet|sq\s*ft|sqft|square/i.test(label)) return <input type="text" value={value||""} onChange={e=>onChange(e.target.value)} placeholder={/sq\s*ft|sqft|square/i.test(label)?"e.g. 12 sq ft, 10.5 sq ft, Custom":"e.g. 24x36, 22 x 38, 12 inch"} style={C.inp}/>;
  // Heel Top / Tapi uses its own type options, not shoe type options.
  if(fk==="type" && /plain|laser|moti|patli|tapi|heel top/i.test(label)) return <select value={value||""} onChange={e=>onChange(e.target.value)} style={{...C.inp,appearance:"none",backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24'%3E%3Cpath fill='%23604830' d='M7 10l5 5 5-5z'/%3E%3C/svg%3E")`,backgroundRepeat:"no-repeat",backgroundPosition:"right 10px center"}}>
    <option value="">— Select —</option>
    {HEEL_TOP_TYPES.map(o=><option key={o} value={o}>{o}</option>)}
  </select>;
  if(fk==="polish_weight_size"){
    const polishType=allData?.polish_type||allData?.type||"";
    const sizeOptions=polishType==="Tube"?POLISH_TUBE_SIZE_OPTIONS:POLISH_TIN_SIZE_OPTIONS;
    return <select value={value||""} onChange={e=>onChange(e.target.value)} style={{...C.inp,appearance:"none",backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24'%3E%3Cpath fill='%23604830' d='M7 10l5 5 5-5z'/%3E%3C/svg%3E")`,backgroundRepeat:"no-repeat",backgroundPosition:"right 10px center"}}>
      <option value="">— Select —</option>
      {sizeOptions.map(o=><option key={o} value={o}>{o}</option>)}
    </select>;
  }
  if(cfg.t==="bool") return <div style={{display:"flex",gap:8}}>
    {["Yes","No"].map(o=>{const active=value===true||value==="true"||value==="Yes"||value===1;const isYes=o==="Yes";const on=(isYes&&active)||(!isYes&&!active&&value!==null&&value!==undefined);
    return <button key={o} onClick={()=>onChange(isYes)} style={{flex:1,padding:"9px",background:on?C.accent:C.card2,border:`1px solid ${on?C.accent:C.border}`,color:on?"#fff":C.sub,borderRadius:0,cursor:"pointer",fontSize:13,fontWeight:on?600:400}}>{o}</button>;})}
  </div>;
  if(cfg.t==="sel")  return <select value={value||""} onChange={e=>onChange(e.target.value)} style={{...C.inp,appearance:"none",backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24'%3E%3Cpath fill='%23604830' d='M7 10l5 5 5-5z'/%3E%3C/svg%3E")`,backgroundRepeat:"no-repeat",backgroundPosition:"right 10px center"}}>
    <option value="">— Select —</option>
    {(cfg.opts||[]).map(o=><option key={o} value={o}>{o}</option>)}
  </select>;
  if(cfg.t==="date") return <input type="date" value={value?String(value).split("T")[0]:""} onChange={e=>onChange(e.target.value)} style={C.inp}/>;
  if(cfg.t==="num")  return <input type="number" value={value||""} onChange={e=>onChange(e.target.value===""?"":Number(e.target.value))} style={C.inp}/>;
  if(cfg.t==="long") return <textarea value={value||""} onChange={e=>onChange(e.target.value)} rows={3} style={{...C.inp,resize:"vertical"}}/>;
  return <input type="text" value={value||""} onChange={e=>onChange(e.target.value)} style={C.inp}/>;
}

// ── Work Order helpers ───────────────────────────────────────
function workOrderDepartment(t){
  if(t==="Upper")return "Upper";
  if(t==="Bottom")return "Bottom";
  if(t==="Finish")return "Finishing";
  if(t==="Order Local"||t==="International Order")return "Order";
  return "";
}

function normalizeWoStatus(v){return String(v||"").toLowerCase().trim();}
function usageModeFromForm(form){
  const action=String(form.material_usage_action||"").toLowerCase();
  const status=normalizeWoStatus(form.work_order_status);
  if(action.includes("release")||status==="cancelled")return "Released";
  if(action.includes("consume")||status==="completed")return "Consumed";
  if(action.includes("reserve")||status==="started working"||status==="in progress")return "Reserved";
  return "";
}


function missingColumnFromError(e){
  const msg=String(e?.message||e||"");
  const m=msg.match(/(?:Could not find the\s+)?'([^']+)'\s+column/i)||msg.match(/column\s+"?([a-zA-Z0-9_]+)"?\s+does not exist/i);
  return m?.[1]||"";
}
async function updateSafe(apiObj,table,id,patch,tok){
  let clean={...patch};
  for(let i=0;i<12;i++){
    try{return await apiObj.update(table,id,clean,tok);}catch(e){
      const col=missingColumnFromError(e);
      if(col&&Object.prototype.hasOwnProperty.call(clean,col)){
        delete clean[col];
        continue;
      }
      throw e;
    }
  }
  return null;
}
function appendUsageText(existing,entry){
  const prev=String(existing||"").trim();
  return [prev,entry].filter(Boolean).join("\n");
}
function materialSourceHistoryPatch(src,it,mode,workOrder,date,form){
  const woLabel=workOrder.serial_number||workOrder.work_order_no||workOrder.id;
  const entry=`${date}: ${mode} ${it.qtyUsed} ${it.unit}${it.usageType?` (${it.usageType})`:""} for WO #${woLabel}${form.used_by?` by ${form.used_by}`:""}`;
  const patch={
    usage_status:mode,
    last_used_date:date,
    last_work_order_id:workOrder.id,
    last_used_work_order_id:workOrder.id,
    used_in_work_order_id:workOrder.id,
    work_order_id:workOrder.id,
    used_date:date,
    date_used:date,
    usage_log:appendUsageText(src?.usage_log,entry),
    material_usage_history:appendUsageText(src?.material_usage_history,entry),
  };
  if(mode==="Consumed"){
    patch.date_consumed=date;
    patch.consumed_date=date;
    patch.consumed_for_work_order_id=workOrder.id;
    patch.reserved_for_work_order_id=null;
  }
  if(mode==="Released"){
    patch.reserved_for_work_order_id=null;
  }
  if(mode==="Reserved"){
    patch.reserved_for_work_order_id=workOrder.id;
  }
  return patch;
}

const QUALITY_FAULT_DETAIL_MAP={
  quality_paitawa:{issue:"quality_paitawa_issue",photo:"quality_paitawa_image_url",label:"Paitawa"},
  quality_upper_silal:{issue:"quality_upper_silal_issue",photo:"quality_upper_silal_image_url",label:"Upper Silal"},
  quality_colored_adda:{issue:"quality_colored_adda_issue",photo:"quality_colored_adda_image_url",label:"Colored Adda"},
  quality_bottom:{issue:"quality_bottom_issue",photo:"quality_bottom_image_url",label:"Bottom"},
  quality_heel:{issue:"quality_heel_issue",photo:"quality_heel_image_url",label:"Heel"},
  quality_upper_finish:{issue:"quality_upper_finish_issue",photo:"quality_upper_finish_image_url",label:"Upper Finish"},
  quality_sole_edge:{issue:"quality_sole_edge_issue",photo:"quality_sole_edge_image_url",label:"Sole Edge"},
  quality_silwat:{issue:"quality_silwat_issue",photo:"quality_silwat_image_url",label:"Silwat"},
  quality_sole_equal:{issue:"quality_sole_equal_issue",photo:"quality_sole_equal_image_url",label:"Left / Right Sole Equal"},
  quality_symmetry_flex:{issue:"quality_symmetry_flex_issue",photo:"quality_symmetry_flex_image_url",label:"Symmetry & Flex Check"},
  quality_sole_attachment:{issue:"quality_sole_attachment_issue",photo:"quality_sole_attachment_image_url",label:"Sole Attachment / Minimal Glue"},
  quality_channel_depth:{issue:"quality_channel_depth_issue",photo:"quality_channel_depth_image_url",label:"Bottom Channel Depth"},
  quality_bottom_stitching:{issue:"quality_bottom_stitching_issue",photo:"quality_bottom_stitching_image_url",label:"Bottom Stitching"},
  quality_edge_smooth:{issue:"quality_edge_smooth_issue",photo:"quality_edge_smooth_image_url",label:"Bottom Edge Smooth"},
  quality_zero_raigmal:{issue:"quality_zero_raigmal_issue",photo:"quality_zero_raigmal_image_url",label:"Zero Raigmal Done"},
};
function isFaultyQualityValue(v){
  const x=String(v||"").toLowerCase().trim();
  return ["faulty","fault","no","failed","fail","issue","problem"].includes(x);
}
function validateWorkOrderQualityBeforeComplete(form){
  const status=normalizeWoStatus(form.work_order_status);
  if(status!=="completed") return null;
  const type=String(form.work_order_type||"").trim();
  const required=[];
  if(type==="Upper") required.push(["quality_paitawa","Paitawa"],["quality_upper_silal","Upper Silal"],["quality_colored_adda","Colored Adda"]);
  if(type==="Bottom") required.push(["quality_silwat","Silwat"],["quality_sole_equal","Left / Right Sole Equal"],["quality_symmetry_flex","Symmetry & Flex Check"],["quality_sole_attachment","Sole Attachment / Minimal Glue"],["quality_channel_depth","Bottom Channel Depth"],["quality_bottom_stitching","Bottom Stitching"],["quality_edge_smooth","Bottom Edge Smooth"],["quality_zero_raigmal","Zero Raigmal Done"]);
  if(type==="Finish") required.push(["quality_upper_finish","Upper Finish"]);
  if(type==="Order Local"||type==="International Order") required.push(["quality_paitawa","Paitawa"],["quality_upper_silal","Upper Silal"],["quality_colored_adda","Colored Adda"],["quality_silwat","Silwat"],["quality_sole_equal","Left / Right Sole Equal"],["quality_symmetry_flex","Symmetry & Flex Check"],["quality_sole_attachment","Sole Attachment / Minimal Glue"],["quality_channel_depth","Bottom Channel Depth"],["quality_bottom_stitching","Bottom Stitching"],["quality_edge_smooth","Bottom Edge Smooth"],["quality_zero_raigmal","Zero Raigmal Done"],["quality_upper_finish","Upper Finish"]);
  const missing=required.filter(([k])=>String(form[k]||"").trim()==="").map(([,l])=>l);
  if(missing.length) return `Before completing this work order, fill the required visible Quality Gate fields for ${type}: ${missing.join(", ")}. If this is not ready for quality check, use Start Work or save as In Progress instead of Complete Work.`;
  const missingFault=[];
  required.forEach(([k,l])=>{
    if(!isFaultyQualityValue(form[k])) return;
    const detail=QUALITY_FAULT_DETAIL_MAP[k];
    if(!detail) return;
    if(!String(form[detail.issue]||"").trim()) missingFault.push(`${l} fault issue`);
    if(!String(form[detail.photo]||"").trim()) missingFault.push(`${l} fault photo`);
  });
  if(missingFault.length) return `Before completing this work order, add required fault details: ${missingFault.join(", ")}.`;
  return null;
}
function materialUsageItems(form){
  const items=[
    {cat:"Upper",field:"upper_leather_id",table:"upper_leather",label:"Upper Leather",unit:"piece",single:true},
    {cat:"Upper",field:"lining_leather_id",table:"lining_leather",label:"Lining Leather",unit:"piece",single:true},
    {cat:"Upper",field:"buckle_id",table:"buckles",label:"Buckle",unit:"record",single:true},
    {cat:"Upper",field:"lace_id",table:"laces",label:"Laces",unit:"record",single:true},
    {cat:"Upper",field:"elastic_id",table:"elastic",label:"Elastic",unit:"record",single:true},
    {cat:"Upper",field:"thread_id",table:"thread",label:"Thread",unit:"record",single:true},
    {cat:"Bottom",field:"leather_sole_id",table:"laser_sole",label:"Leather Sole",unit:"pair",single:true},
    {cat:"Bottom",field:"rubber_sole_id",table:"rubber_laser_sole",label:"Rubber Sole",unit:"pair",single:true},
    {cat:"Bottom",field:"putha_id",table:"putha_sole_leather",label:"Putha Sole Leather",unit:"piece",single:true},
    {cat:"Bottom",field:"heel_id",table:"heels",label:"Heel",unit:"pair",single:true},
    {cat:"Bottom",field:"heel_top_id",table:"heel_tops",label:"Heel Top / Tapi",unit:"pair",single:true},
    {cat:"Bottom",field:"sooti_welt_id",table:"sooti_welt",label:"Sooti / Welt",qty:"sooti_qty_used",unit:"inches",stock:"quantity_inches"},
    {cat:"Bottom",field:"sole_sheet_id",table:"sole_sheets",label:"Sole Sheet",unit:"sheet",single:true},
    {cat:"Bottom",field:"leather_board_id",table:"leather_board",label:"Leather Board",unit:"sheet",single:true},
    {cat:"Bottom",field:"mek_id",table:"mek_sheet",label:"MEK Sheet",unit:"piece",single:true},
    {cat:"Bottom",field:"solution_id",table:"solution",label:"Solution",unit:"use",single:true},
    {cat:"Finish",field:"finishing_id",table:"finishing",label:"Dye / Finishing Color",unit:"use",single:true},
    {cat:"Finish",field:"shoe_polish_id",table:"shoe_polish",label:"Shoe Polish",unit:"use",single:true},
  ];
  return items.filter(x=>form[x.field]).map(x=>{
    let qty=1;
    if(x.qty) qty=Number(form[x.qty])||1;
    if(x.field==="sooti_welt_id"&&form.is_sooti_used!=="Yes") return null;
    if(x.field==="sooti_welt_id"&&!Number(form[x.qty])) qty=String(form.sooti_half_full||"").toLowerCase().includes("half")?18:36;
    const usageType=x.field==="sooti_welt_id"?(form.sooti_half_full||"Full"):"";
    return {...x,recordId:form[x.field],qtyUsed:qty,usageType};
  }).filter(Boolean);
}
async function syncMaterialUsage(apiObj,tok,workOrder,form){
  const mode=usageModeFromForm(form);
  if(!mode||!workOrder?.id)return {mode,attempted:0,logged:0,errors:[],message:"No material workflow action was triggered."};
  const items=materialUsageItems(form);
  if(!items.length)return {mode,attempted:0,logged:0,errors:[],message:"No linked materials were selected, so nothing was added to Material Usage Log."};

  // Final approach: normal workers fill usage in the Work Order, and the detailed log is written in the background on completion.
  // Reserve/release can update source status where columns exist, but it does not create audit rows that clutter the log.
  const result={mode,attempted:items.length,logged:0,errors:[]};
  const date=form.date_used||new Date().toISOString().slice(0,10);

  let existing=[];
  if(mode==="Consumed"){
    existing=await apiObj.list("material_usage_log",tok).catch(e=>{result.errors.push(`Could not read material_usage_log: ${e.message||e}`);return[];});
  }

  for(const it of items){
    let src=null;
    try{
      const rows=await apiObj.list(it.table,tok);
      src=Array.isArray(rows)?rows.find(r=>String(r.id)===String(it.recordId)):null;
    }catch(e){console.warn("Material source read skipped",it.table,it.recordId,e);}

    if(mode==="Consumed"){
      const old=Array.isArray(existing)?existing.find(r=>String(r.work_order_id)===String(workOrder.id)&&String(r.material_table)===String(it.table)&&String(r.material_record_id)===String(it.recordId)):null;
      const rec={
        work_order_id:workOrder.id,
        department:form.department||workOrder.department||workOrderDepartment(form.work_order_type),
        work_order_type:form.work_order_type||workOrder.work_order_type,
        material_category:it.cat,
        material_table:it.table,
        material_record_id:it.recordId,
        material_name:src?.name||src?.color||src?.style||src?.type||src?.size||it.label,
        quantity_used:it.qtyUsed,
        unit:it.unit,
        usage_status:"Consumed",
        date_used:date,
        used_by:form.used_by||form.assigned_to||"",
        notes:`Consumed from work order ${workOrder.serial_number||workOrder.id}${it.usageType?` — ${it.usageType}`:""}`
      };
      try{
        old?.id?await updateSafe(apiObj,"material_usage_log",old.id,rec,tok):await apiObj.insert("material_usage_log",rec,tok);
        result.logged+=1;
      }catch(e){
        console.warn("Material usage log failed",e);
        result.errors.push(`${it.label}: ${e.message||e}`);
      }
    }

    // Update the source material record so the material itself shows where/when/how much it was used.
    try{
      const patch=materialSourceHistoryPatch(src,it,mode,workOrder,date,form);
      if(mode==="Consumed"){
        patch.quantity_used=(Number(src?.quantity_used)||0)+it.qtyUsed;
        patch.total_used=(Number(src?.total_used)||0)+it.qtyUsed;
        // single-piece items are not reduced by numeric stock; they are marked consumed.
        if(it.single){
          patch.status="Consumed";
          patch.available=false;
        }
        // quantity materials are deducted if the stock field exists.
        if(it.stock&&src&&src[it.stock]!==undefined&&src[it.stock]!==null&&!isNaN(Number(src[it.stock]))){
          patch[it.stock]=Math.max(0,(Number(src[it.stock])||0)-it.qtyUsed);
          patch.quantity_available=patch[it.stock];
        }
      }
      await updateSafe(apiObj,it.table,it.recordId,patch,tok);
    }catch(e){
      console.warn("Material source update skipped",it.table,it.recordId,e);
      result.errors.push(`${it.label} source update skipped: ${e.message||e}`);
    }
  }
  if(mode!=="Consumed")result.message=`${mode} updated on selected source records where matching columns exist. Detailed usage log is created on completion only.`;
  return result;
}

function workflowState(form){
  const status=String(form.work_order_status||'Pending').trim();
  const normalized=status.toLowerCase();
  if(form.is_done||normalized==='completed')return 'completed';
  if(normalized==='cancelled')return 'cancelled';
  if(['started working','in progress','started'].includes(normalized))return 'active';
  if(normalized==='on hold')return 'hold';
  return 'pending';
}
function nextWorkflowPatch(form,action){
  if(action==='start')return {work_order_status:'Started Working',material_usage_action:'Reserve Materials',is_done:false};
  if(action==='complete')return {work_order_status:'Completed',material_usage_action:'Consume Materials',is_done:true};
  if(action==='hold')return {work_order_status:'On Hold',material_usage_action:'None',is_done:false};
  if(action==='resume')return {work_order_status:'Started Working',material_usage_action:'Reserve Materials',is_done:false};
  if(action==='cancel')return {work_order_status:'Cancelled',material_usage_action:'Release Materials',is_done:false};
  return {};
}

function bottomQualityFields(){
  return [
    {k:"quality_silwat",l:"Silwat"},
    {k:"quality_sole_equal",l:"Left / Right Sole Equal"},
    {k:"quality_symmetry_flex",l:"Symmetry & Flex Check"},
    {k:"quality_sole_attachment",l:"Sole Attachment / Minimal Glue"},
    {k:"quality_channel_depth",l:"Bottom Channel Depth"},
    {k:"quality_bottom_stitching",l:"Bottom Stitching"},
    {k:"quality_edge_smooth",l:"Bottom Edge Smooth"},
    {k:"quality_zero_raigmal",l:"Zero Raigmal Done"},
  ];
}
function workOrderQualityFields(type){
  const upper=[{k:"quality_paitawa",l:"Paitawa"},{k:"quality_upper_silal",l:"Upper Silal"},{k:"quality_colored_adda",l:"Colored Adda"}];
  const bottom=bottomQualityFields();
  const finish=[{k:"quality_upper_finish",l:"Upper Finish"}];
  if(type==="Upper") return upper;
  if(type==="Bottom") return bottom;
  if(type==="Finish") return finish;
  if(type==="Order Local"||type==="International Order") return [...upper,...bottom,...finish];
  return [];
}
function workOrderQualityRequiredKeys(type){
  return workOrderQualityFields(type).map(f=>[f.k,f.l]);
}
function workOrderQualitySummary(row){
  const type=String(row?.work_order_type||"").trim();
  const required=workOrderQualityRequiredKeys(type);
  if(!required.length) return {label:"N/A",kind:"gray"};
  const missing=[];
  const faulty=[];
  required.forEach(([k,l])=>{
    const v=String(row?.[k]||"").trim();
    if(!v){missing.push(l);return;}
    if(isFaultyQualityValue(v)) faulty.push(l);
  });
  if(faulty.length) return {label:"Faulty",kind:"red",title:faulty.join(", ")};
  if(missing.length) return {label:"Needed",kind:"amber",title:missing.join(", ")};
  return {label:"Passed",kind:"green"};
}

function WorkOrderTopQualityGate({form,setForm,tok}){
  const type=String(form.work_order_type||"").trim();
  const fields=workOrderQualityFields(type);
  const required=workOrderQualityRequiredKeys(type);
  if(!fields.length) return null;
  const missing=required.filter(([k])=>String(form[k]||"").trim()==="").map(([,l])=>l);
  const faultDetails=[];
  required.forEach(([k,l])=>{
    if(!isFaultyQualityValue(form[k])) return;
    const detail=QUALITY_FAULT_DETAIL_MAP[k];
    if(!detail) return;
    const issueMissing=!String(form[detail.issue]||"").trim();
    const photoMissing=!String(form[detail.photo]||"").trim();
    if(issueMissing||photoMissing) faultDetails.push(`${l} fault details`);
  });
  const isFullPair=type==="Order Local"||type==="International Order";
  const showOverallQuality=true;
  const completeReady=missing.length===0&&faultDetails.length===0;
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const pendingCount=missing.length+faultDetails.length;
  const statusLabel=completeReady?'Quality passed':`${pendingCount} quality item${pendingCount===1?'':'s'} needed`;
  const showFaultDetail=(f)=>isFaultyQualityValue(form[f.k])&&QUALITY_FAULT_DETAIL_MAP[f.k];
  return <details open={!completeReady} style={{borderTop:`1px solid ${C.border}`,borderBottom:`1px solid ${C.border}`,background:completeReady?'#F7FFF9':'#FFFDF5'}}>
    <summary style={{listStyle:'none',cursor:'pointer',padding:'9px 12px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}>
      <div style={{display:'flex',alignItems:'center',gap:10,minWidth:0}}>
        <span style={{width:18,height:18,border:`1px solid ${completeReady?'#BBF7D0':'#FDE68A'}`,background:completeReady?'#DCFCE7':'#FEF3C7',color:completeReady?C.ok:'#92400E',display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:900,flex:'0 0 auto'}}>{completeReady?'✓':'!'}</span>
        <div style={{minWidth:0}}>
          <p style={{margin:0,color:C.text,fontSize:12,fontWeight:900,textTransform:'uppercase',letterSpacing:'0.04em'}}>Quality Gate</p>
          <p style={{margin:'2px 0 0',color:completeReady?C.ok:'#92400E',fontSize:11,fontWeight:700,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{statusLabel}</p>
        </div>
      </div>
      <span style={{color:C.sub,fontSize:11,fontWeight:800,textTransform:'uppercase'}}>{completeReady?'View':'Fill'} <i className="ti ti-chevron-down"/></span>
    </summary>
    <div style={{padding:'0 12px 12px'}}>
      {(missing.length>0||faultDetails.length>0)&&<p style={{margin:'0 0 8px',color:'#92400E',fontSize:11,lineHeight:1.35}}>Missing: {[...missing,...faultDetails].join(', ')}</p>}
      <div style={{display:'grid',gridTemplateColumns:fields.length>4?'repeat(2, minmax(0, 1fr))':'repeat(3, minmax(0, 1fr))',gap:'8px 10px'}}>
        {fields.map(f=>{const detail=showFaultDetail(f);return <React.Fragment key={f.k}>
          <div>
            <label style={{display:'block',color:C.sub,fontSize:9,fontWeight:800,textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:4}}>{f.l}</label>
            <FormField fk={f.k} label={f.l} value={form[f.k]} onChange={v=>set(f.k,v)} sbUrl={SB_URL} tok={tok} allData={form}/>
          </div>
          {detail&&<div style={{gridColumn:'1 / -1',border:`1px solid ${C.border}`,background:'#FFFFFF',padding:10,marginTop:-2}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8,marginBottom:8}}>
              <strong style={{color:'#92400E',fontSize:11,textTransform:'uppercase',letterSpacing:'0.06em'}}>{f.l} Fault Evidence</strong>
              <span style={{color:C.sub,fontSize:10}}>Issue + photo required</span>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'minmax(0, 1.4fr) minmax(220px, .8fr)',gap:10}}>
              <div>
                <label style={{display:'block',color:C.sub,fontSize:9,fontWeight:800,textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:4}}>{f.l} Fault Issue</label>
                <FormField fk={detail.issue} label={`${f.l} Fault Issue`} value={form[detail.issue]} onChange={v=>set(detail.issue,v)} sbUrl={SB_URL} tok={tok} allData={form}/>
              </div>
              <div>
                <label style={{display:'block',color:C.sub,fontSize:9,fontWeight:800,textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:4}}>{f.l} Fault Photo</label>
                <FormField fk={detail.photo} label={`${f.l} Fault Photo`} value={form[detail.photo]} onChange={v=>set(detail.photo,v)} sbUrl={SB_URL} tok={tok} allData={form}/>
              </div>
            </div>
          </div>}
        </React.Fragment>})}
        {showOverallQuality&&<div style={{gridColumn:'1 / -1',borderTop:`1px solid ${C.border}`,paddingTop:10,marginTop:2}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8,marginBottom:8}}>
            <strong style={{color:C.text,fontSize:11,textTransform:'uppercase',letterSpacing:'0.06em'}}>Overall Quality Evidence</strong>
            <span style={{color:C.sub,fontSize:10}}>{isFullPair?'Full pair notes/photo':'Optional notes/photo for this gate'}</span>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'minmax(0, 1.4fr) minmax(220px, .8fr)',gap:10}}>
            <div>
              <label style={{display:'block',color:C.sub,fontSize:9,fontWeight:800,textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:4}}>Overall Quality Notes</label>
              <FormField fk="quality_fault_explanation" label="Overall Quality Notes" value={form.quality_fault_explanation} onChange={v=>set('quality_fault_explanation',v)} sbUrl={SB_URL} tok={tok} allData={form}/>
            </div>
            <div>
              <label style={{display:'block',color:C.sub,fontSize:9,fontWeight:800,textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:4}}>Overall Quality Photo</label>
              <FormField fk="quality_fault_image_url" label="Overall Quality Photo" value={form.quality_fault_image_url} onChange={v=>set('quality_fault_image_url',v)} sbUrl={SB_URL} tok={tok} allData={form}/>
            </div>
          </div>
        </div>}
      </div>
    </div>
  </details>;
}

function WorkOrderActionCenter({form,setForm,onSave,saving,tok}){
  const quickSave=(patch)=>{
    const next={...form,...patch,department:form.department||workOrderDepartment(form.work_order_type)};
    setForm(next);
    onSave(next);
  };
  const state=workflowState(form);
  const department=form.department||workOrderDepartment(form.work_order_type)||'—';
  const status=form.work_order_status||'Pending';
  const actionText={
    pending:'Start work and reserve materials.',
    active:'Work active. Complete when done.',
    hold:'On hold. Resume when ready.',
    completed:'Completed. Materials logged.',
    cancelled:'Cancelled. Reserved material released.'
  }[state];
  const primary=state==='pending'?{label:'Start Work',icon:'ti-player-play',patch:nextWorkflowPatch(form,'start')}
    :state==='active'?{label:'Complete Work',icon:'ti-circle-check',patch:nextWorkflowPatch(form,'complete')}
    :state==='hold'?{label:'Resume Work',icon:'ti-player-play',patch:nextWorkflowPatch(form,'resume')}
    :null;
  const stageNum=state==='pending'?1:state==='active'||state==='hold'?2:state==='completed'?3:0;
  const step=(n,label,active,done)=><div style={{display:'flex',alignItems:'center',gap:6,opacity:active||done?1:.45,whiteSpace:'nowrap'}}>
    <span style={{width:16,height:16,border:`1px solid ${done?C.ok:active?C.accent:C.borderL}`,background:done?C.ok:active?C.accent:'#fff',color:done?'#fff':'#111',display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:900}}>{done?'✓':n}</span>
    <span style={{fontSize:11,fontWeight:800,color:active?C.text:C.sub,textTransform:'uppercase',letterSpacing:'0.03em'}}>{label}</span>
  </div>;
  const linkField=(fk,label)=><div>
    <label style={{display:'block',color:C.sub,fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:6}}>{label}</label>
    <FormField fk={fk} label={label} value={form[fk]} onChange={v=>setForm(f=>({...f,[fk]:v}))} sbUrl={SB_URL} tok={tok} allData={form}/>
  </div>;
  const type=String(form.work_order_type||"").trim();
  const typeFlow=type==="Finish"?["Pair selected","Finish details","Quality","Complete"]:type==="Bottom"?["Upper selected","Bottom build","Quality","Complete"]:type==="Upper"?["Materials","Upper build","Quality","Complete"]:[];
  return <div style={{border:`1px solid ${C.borderL}`,background:'#FFFFFF',marginBottom:14}}>
    <div style={{display:'grid',gridTemplateColumns:'1fr auto',gap:12,alignItems:'center',padding:10,borderBottom:`1px solid ${C.border}`}}>
      <div style={{minWidth:0}}>
        <div style={{display:'flex',gap:12,alignItems:'center',flexWrap:'wrap'}}>
          {step(1,'Open',stageNum===1,stageNum>1)}
          {step(2,'Started',stageNum===2,stageNum>2)}
          {step(3,'Completed',stageNum===3,false)}
        </div>
        {typeFlow.length>0&&<div style={{display:'flex',gap:6,alignItems:'center',marginTop:7,flexWrap:'wrap'}}>
          {typeFlow.map((x,i)=><React.Fragment key={x}><span style={{fontSize:10,color:C.sub,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.04em'}}>{x}</span>{i<typeFlow.length-1&&<span style={{color:C.dim,fontSize:10}}>→</span>}</React.Fragment>)}
        </div>}
        <p style={{margin:'6px 0 0',color:C.sub,fontSize:11,lineHeight:1.3,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{status} • {department} • {actionText}</p>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',justifyContent:'flex-end'}}>
        {primary&&<button type='button' disabled={saving} onClick={()=>quickSave(primary.patch)} style={{background:C.accent,border:`1px solid ${C.accent}`,color:'#111',padding:'8px 14px',fontSize:12,fontWeight:900,cursor:saving?'wait':'pointer',display:'flex',alignItems:'center',gap:7,justifyContent:'center',borderRadius:0,minWidth:130,whiteSpace:'nowrap'}}>
          <i className={`ti ${primary.icon}`} style={{fontSize:14}}/>{primary.label}
        </button>}
        {state==='active'&&<button type='button' disabled={saving} onClick={()=>quickSave(nextWorkflowPatch(form,'hold'))} style={{background:'#fff',border:`1px solid ${C.borderL}`,color:C.text,padding:'8px 10px',fontSize:12,fontWeight:700,cursor:saving?'wait':'pointer',borderRadius:0,whiteSpace:'nowrap'}}>Hold</button>}
        {state!=='completed'&&state!=='cancelled'&&<button type='button' disabled={saving} onClick={()=>quickSave(nextWorkflowPatch(form,'cancel'))} style={{background:'#fff',border:`1px solid ${C.borderL}`,color:C.text,padding:'8px 10px',fontSize:12,fontWeight:700,cursor:saving?'wait':'pointer',borderRadius:0,whiteSpace:'nowrap'}}>Cancel</button>}
        {state==='cancelled'&&<button type='button' disabled={saving} onClick={()=>quickSave(nextWorkflowPatch(form,'resume'))} style={{background:'#fff',border:`1px solid ${C.borderL}`,color:C.text,padding:'8px 10px',fontSize:12,fontWeight:700,cursor:saving?'wait':'pointer',borderRadius:0,whiteSpace:'nowrap'}}>Reopen</button>}
      </div>
    </div>
    <WorkOrderTopQualityGate form={form} setForm={setForm} tok={tok}/>
    <details style={{padding:'9px 12px'}}>
      <summary style={{cursor:'pointer',fontSize:12,fontWeight:800,color:C.text}}>Process Video <span style={{color:C.sub,fontWeight:500}}>— optional work reference</span></summary>
      <div style={{display:'grid',gridTemplateColumns:'1fr',gap:10,marginTop:12}}>
        {linkField('marketing_video_id','Marketing / Process Video')}
      </div>
    </details>
  </div>;
}


function shouldHideWorkOrderField(secTitle,fieldKey,form){
  if(secTitle==="Upper Start"&&fieldKey==="upper_id"&&String(form.upper_new_or_old||"").toUpperCase()!=="EXISTING") return true;
  if(secTitle==="Bottom Section"&&fieldKey==="leather_sole_id"&&form.sole_material_choice!=="Leather Sole") return true;
  if(secTitle==="Bottom Section"&&fieldKey==="rubber_sole_id"&&form.sole_material_choice!=="Rubber Sole") return true;
  if(secTitle==="Bottom Section"&&["sooti_half_full","sooti_welt_id"].includes(fieldKey)&&form.is_sooti_used!=="Yes") return true;
  return false;
}
function shouldHideCustomerField(secTitle,fieldKey,form){
  if(secTitle!=="Size Source") return false;
  const mode=form.customer_size_mode||form.customer_size_type||"Generic Size";
  if(fieldKey==="size"&&mode!=="Generic Size") return true;
  if(["unit","point_a","point_b","point_c","point_d","point_e"].includes(fieldKey)&&mode!=="Provided Measurement") return true;
  return false;
}

// ── Record Modal with sections ───────────────────────────────


// ── Browser Image AI Draft Helpers ───────────────────────────
// No backend needed for this version: the browser reads the uploaded image with canvas.
// This is not as strong as GPT/Vision API, but it is REAL pixel-based analysis,
// not just filename guessing. Later, analyzeImageTextureDraft / analyzeInspirationDraft
// can be replaced by a hosted vision endpoint with the same popup UX.
function loadImageForAnalysis(src){
  return new Promise((resolve,reject)=>{
    if(!src)return reject(new Error("No image uploaded"));
    const img=new Image();
    img.crossOrigin="anonymous";
    img.onload=()=>resolve(img);
    img.onerror=()=>reject(new Error("Image could not be read. Try re-uploading it in this popup."));
    img.src=src;
  });
}


async async function callAiVisionRecognizer(kind,form={}){
  if(!form.image_url){
    throw new Error("Upload an image first, then click Analyze.");
  }
  let res;
  try{
    res=await fetch("/api/ai-recognize",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({kind,image:form.image_url,context:form})
    });
  }catch(e){
    throw new Error("AI vision backend is not reachable. Add api/ai-recognize.js to your deployment first.");
  }
  if(res.status===404){
    throw new Error("AI vision backend is missing. Add api/ai-recognize.js and set OPENAI_API_KEY.");
  }
  let json=null;
  try{json=await res.json();}catch(e){}
  if(!res.ok){
    throw new Error(json?.error||`AI vision failed (${res.status}).`);
  }
  const fields=json?.fields||json;
  if(!fields||typeof fields!=="object"){
    throw new Error("AI vision returned no usable fields.");
  }
  return fields;
}
async function getImageTextureMetrics(src){
  const img=await loadImageForAnalysis(src);
  const w=96,h=96;
  const canvas=document.createElement("canvas");
  canvas.width=w;canvas.height=h;
  const ctx=canvas.getContext("2d",{willReadFrequently:true});
  ctx.drawImage(img,0,0,w,h);
  const {data}=ctx.getImageData(0,0,w,h);
  const gray=new Float32Array(w*h);
  let mean=0, dark=0, bright=0, satSum=0;
  for(let i=0,p=0;i<data.length;i+=4,p++){
    const r=data[i],g=data[i+1],b=data[i+2];
    const mx=Math.max(r,g,b),mn=Math.min(r,g,b);
    const y=0.299*r+0.587*g+0.114*b;
    gray[p]=y;mean+=y;
    if(y<70)dark++;
    if(y>190)bright++;
    satSum+=(mx-mn);
  }
  mean/=gray.length;
  const gxVals=[],gyVals=[],diag1Vals=[],diag2Vals=[];
  let edge=0,gxSum=0,gySum=0,diag1=0,diag2=0,strong=0;
  let orientationDiverse=0;
  for(let y=1;y<h-1;y++){
    for(let x=1;x<w-1;x++){
      const p=y*w+x;
      const gx=Math.abs(gray[p+1]-gray[p-1]);
      const gy=Math.abs(gray[p+w]-gray[p-w]);
      const d1=Math.abs(gray[p+w+1]-gray[p-w-1]);
      const d2=Math.abs(gray[p+w-1]-gray[p-w+1]);
      const mag=Math.max(gx,gy,d1,d2);
      gxSum+=gx;gySum+=gy;diag1+=d1;diag2+=d2;
      gxVals.push(gx);gyVals.push(gy);diag1Vals.push(d1);diag2Vals.push(d2);
      if(mag>34){edge++;strong++;}
      if(gx>24&&gy>24)orientationDiverse++;
      else if((d1>24||d2>24)&&(gx>18||gy>18))orientationDiverse++;
    }
  }
  const cells=(w-2)*(h-2);
  const edgeDensity=edge/cells;
  const darkRatio=dark/gray.length;
  const brightRatio=bright/gray.length;
  const colorfulness=satSum/gray.length;

  const avg=a=>a.reduce((s,v)=>s+v,0)/(a.length||1);
  const variance=a=>{const m=avg(a);return avg(a.map(v=>(v-m)*(v-m)));};
  const gv=avg(gxVals),gh=avg(gyVals),gd1=avg(diag1Vals),gd2=avg(diag2Vals);
  const maxOri=Math.max(gv,gh,gd1,gd2);
  const minOri=Math.min(gv,gh,gd1,gd2);
  const orientationBalance=maxOri?minOri/maxOri:0;
  const diagDominance=(gd1+gd2)/(gv+gh+1);
  const hvDominance=(gv+gh)/(gd1+gd2+1);
  const roughness=Math.sqrt(variance(gxVals)+variance(gyVals)+variance(diag1Vals)+variance(diag2Vals))/100;
  const diverseRatio=orientationDiverse/cells;

  return {mean,darkRatio,brightRatio,colorfulness,edgeDensity,gv,gh,gd1,gd2,orientationBalance,diagDominance,hvDominance,roughness,diverseRatio,width:img.naturalWidth,height:img.naturalHeight};
}

function textureDraftFromMetrics(m,form={}){
  const raw=[form.pattern_name,form.description,form.image_url,form.best_use,form.design_notes,form.ai_search_summary].map(v=>String(v||"").toLowerCase()).join(" ");
  const has=(...words)=>words.some(w=>raw.includes(w));
  // Text clues override when admin gave a clue.
  if(has("croc","crocodile","alligator","gator","caiman")) return makePatternDraft("Crocodile Belly Scale Emboss","Crocodile / Alligator Texture",form);
  if(has("snake","python","serpent")) return makePatternDraft("Snake Scale Emboss","Snake Texture",form);
  if(has("lizard","iguana")) return makePatternDraft("Lizard Scale Emboss","Lizard Texture",form);
  if(has("ostrich")) return makePatternDraft("Ostrich Leather Emboss","Ostrich Texture",form);
  if(has("diamond","argyle","rhombus")) return makePatternDraft("Diamond Grid Pattern","Diamond Grid",form);
  if(has("hexagon","hexagonal","honeycomb")) return makePatternDraft("Hexagonal Weave Pattern","Hexagonal Weave",form);
  if(has("perfor","hole")) return makePatternDraft("Micro Perforated Pattern","Micro Perforated",form);
  if(has("weave","woven","basket")) return makePatternDraft("Woven Leather Pattern","Weave",form);

  // Real pixel-based rules:
  // 1) repeated small grid: high H/V edge structure and low irregularity
  if(m.edgeDensity>0.23 && m.hvDominance>1.04 && m.diverseRatio<0.42){
    if(m.diagDominance>0.82) return makePatternDraft("Micro Diamond Grid Pattern","Diamond Grid",form);
    return makePatternDraft("Micro Box Grid Pattern","Box Grid",form);
  }
  // 2) diagonal/diamond repeated pattern
  if(m.edgeDensity>0.18 && m.diagDominance>1.04){
    return makePatternDraft("Diamond Grid Pattern","Diamond Grid",form);
  }
  // 3) animal/croc scale: dark/irregular crack network, rough, multiple orientations,
  // not a clean repeating micro grid.
  if((m.edgeDensity>0.11 && m.roughness>0.58 && m.diverseRatio>0.34 && m.hvDominance<1.55) || (m.darkRatio>0.28 && m.edgeDensity>0.09 && m.roughness>0.50)){
    return makePatternDraft("Crocodile Belly Scale Emboss","Crocodile / Alligator Texture",form);
  }
  // 4) perforation-like: high contrast dots / holes
  if(m.darkRatio>0.18 && m.edgeDensity>0.16 && m.brightRatio>0.08){
    return makePatternDraft("Micro Perforated Pattern","Micro Perforated",form);
  }
  // fallback
  return makePatternDraft("Textured Leather Emboss Pattern","Texture",form);
}

function makePatternDraft(patternName,patternType,form={}){
  const bestLeather="Plain Leather";
  const isCroc=patternType==="Crocodile / Alligator Texture";
  const isAnimal=["Crocodile / Alligator Texture","Snake Texture","Lizard Texture","Ostrich Texture","Animal Texture"].includes(patternType);
  const isGrid=["Diamond Grid","Box Grid","Grid","Micro Weave","Micro Perforated"].includes(patternType);
  return {
    pattern_name:form.pattern_name||patternName,
    pattern_type:patternName,
    upper_leather_type:bestLeather,
    best_use:form.best_use||(isCroc
      ?"Best for loafer vamps, monk strap panels, mule vamps, oxford quarter accents, and luxury statement uppers."
      :isGrid
        ?"Best for loafer vamps, monk strap panels, oxford quarters, and formal upper accent panels."
        :"Best for plain leather upper panels, vamp details, quarter panels, and custom design accents."),
    avoid_use:form.avoid_use||(isAnimal
      ?"Avoid on already embossed leather, heavy grain leather, suede, or designs with heavy brogue punching because the texture will fight the holes and stitching."
      :"Avoid on already embossed leather, heavy grain leather, cracked leather, or designs where the pattern may fight with brogue holes or stitching."),
    design_notes:form.design_notes||(isCroc
      ?"Use as a premium texture accent. Keep large scale pieces on the vamp or side panel and avoid cutting through the main scale center. Test emboss depth on scrap leather first."
      :"Use as a controlled accent instead of covering every panel. Test on scrap leather first to confirm depth, color change, and repeat alignment."),
    ai_search_summary:form.ai_search_summary||`${patternName}. ${patternType} for leather design references, emboss planning, and future AI design suggestions. Works best on plain leather and upper accent panels.`,
    laser_pattern_status:"Ready for AI",
  };
}

async function analyzeLaserPatternFromImage(form={}){
  const api=await callAiVisionRecognizer("laser_pattern",form);
  const name=api.pattern_name||api.pattern_type||api.name;
  return {
    ...api,
    pattern_name:name||form.pattern_name||"Custom",
    pattern_type:name||api.pattern_type||form.pattern_type||"Custom",
    best_use:api.best_use||form.best_use||"",
    avoid_use:api.avoid_use||form.avoid_use||"",
    design_notes:api.design_notes||form.design_notes||"",
    ai_search_summary:api.ai_search_summary||form.ai_search_summary||"",
    laser_pattern_status:api.laser_pattern_status||"Ready for AI"
  };
}
function LaserPatternAiAssistant({form,setForm}){
  const hasImage=String(form.image_url||"").trim();
  const[analyzing,setAnalyzing]=useState(false);
  const[message,setMessage]=useState("");
  const run=async()=>{
    setAnalyzing(true);setMessage("");
    try{
      const draft=await analyzeLaserPatternFromImage(form);
      setForm(f=>({...f,...draft}));
      setMessage("AI vision analyzed the image. Review the suggested fields, then save.");
    }catch(e){
      setMessage(e?.message||"Could not analyze image. Add notes and try again.");
    }finally{setAnalyzing(false);}
  };
  return <div style={{border:`1px solid ${C.border}`,background:"#FFF8E8",padding:14,marginBottom:18}}>
    <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12}}>
      <div style={{minWidth:0}}>
        <p style={{margin:0,color:C.text,fontSize:13,fontWeight:900,textTransform:"uppercase",letterSpacing:"0.07em"}}><i className="ti ti-robot" style={{marginRight:7,color:C.accent}}/>AI Pattern Recognition</p>
        <p style={{margin:"6px 0 0",color:C.sub,fontSize:12,lineHeight:1.55}}>Upload a pattern image, then click Analyze. This uses the real /api/ai-recognize vision backend. It will not fill wrong guesses if the backend is missing.</p>
      </div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"flex-end"}}>
        <button type="button" onClick={run} disabled={analyzing||!hasImage} style={{background:C.accent,border:"none",color:"#111",padding:"9px 13px",fontSize:12,fontWeight:800,cursor:analyzing||!hasImage?"not-allowed":"pointer",whiteSpace:"nowrap",opacity:(analyzing||!hasImage)?0.7:1}}>
          <i className="ti ti-sparkles" style={{marginRight:6}}/>{analyzing?"Analyzing…":"Analyze Image"}
        </button>
        <button type="button" onClick={()=>setForm(f=>({...f,...makePatternDraft("Crocodile Belly Scale Emboss","Crocodile / Alligator Texture",f)}))} style={{background:"#111",border:"none",color:"#fff",padding:"9px 13px",fontSize:12,fontWeight:800,cursor:"pointer",whiteSpace:"nowrap"}}>
          Crocodile Draft
        </button>
      </div>
    </div>
    {!hasImage&&<p style={{margin:"8px 0 0",color:"#92400E",fontSize:11,lineHeight:1.45}}>Upload a pattern image first. This analyzer works best on cropped pattern photos with clear texture.</p>}
    {message&&<p style={{margin:"8px 0 0",color:"#15803D",fontSize:11,lineHeight:1.45}}>{message}</p>}
  </div>;
}

function inspirationDraftFromTextAndImage(form={},metrics=null){
  const raw=[form.notes,form.tags,form.design_elements,form.construction_notes,form.ai_search_summary,form.image_url].map(v=>String(v||"").toLowerCase()).join(" ");
  const has=(...words)=>words.some(w=>raw.includes(w));
  let designType="";
  let typeOf="Complete Pair";
  let toe="";
  let closure="";
  if(has("oxford","wholecut","cap toe","wingtip","brogue")){designType=has("wholecut")?"Wholecut Oxford":has("wingtip")?"Wingtip Oxford":has("cap toe")?"Cap Toe Oxford":"Oxford";closure="Lace Up";typeOf="Complete Pair";}
  else if(has("derby","longwing")){designType=has("longwing")?"Longwing Brogue":"Derby";closure="Lace Up";}
  else if(has("monk")){designType=has("double")?"Double Monk Strap":"Monk Strap";closure="Monk Strap";}
  else if(has("chelsea","chukka","boot")){designType=has("chelsea")?"Chelsea Boot":has("chukka")?"Chukka Boot":"Boot";closure=has("zip")?"Zipper":"Slip On";}
  else if(has("mule","backless")){designType="Mule / Backless Loafer";closure="Backless";}
  else if(has("sandal")){designType="Sandal";closure="Slip On";}
  else if(has("belt")){designType="Belt";typeOf="Hardware";closure="Buckle";}
  else if(has("tassel")){designType="Tassel Loafer";closure="Tassel";}
  else if(has("horsebit")){designType="Horsebit Loafer";closure="Horsebit";}
  else if(has("penny")){designType="Penny Loafer";closure="Slip On";}
  // Conservative visual fallback: a full shoe photo with no style text should not become Monk.
  if(!designType && metrics && metrics.edgeDensity>0.06) { designType="Oxford"; closure="Lace Up"; }
  if(has("pointed"))toe="Pointed"; else if(has("square"))toe="Square"; else if(has("round"))toe="Round"; else if(has("apron"))toe="Apron Toe"; else if(has("wingtip"))toe="Wingtip"; else if(has("cap toe"))toe="Cap Toe"; else toe="Almond";
  if(metrics&&metrics.edgeDensity>0.25&&has("pattern","texture")) typeOf="Pattern / Texture Reference";
  const confidence=raw.trim()?"medium":"low";
  return {
    type_of_inspiration:form.type_of_inspiration||typeOf,
    design_type:form.design_type||designType||"Other",
    toe_shape:form.toe_shape||toe,
    closure_type:form.closure_type||closure||"Other",
    tags:form.tags||[designType||"Needs Review",typeOf,toe,closure||"Unknown Closure"].filter(Boolean).join(", "),
    design_elements:form.design_elements||`Review this reference manually. Browser fallback suggested ${designType||"Other"} with ${toe} toe and ${closure||"unknown"} closure. Use visible silhouette, upper panel layout, and proportions as searchable design memory.`,
    construction_notes:form.construction_notes||"Review manufacturability against available farma/last, upper leather, bottom material, and workshop rules before production.",
    ai_search_summary:form.ai_search_summary||`${designType||"Needs review"} inspiration reference. Browser fallback confidence: ${confidence}. For accurate style recognition, connect /api/ai-recognize to a vision model.`,
    inspiration_status:"Ready for AI",
  };
}

async function analyzeInspirationFromImage(form={}){
  const api=await callAiVisionRecognizer("inspiration",form);
  return {
    ...api,
    type_of_inspiration:api.type_of_inspiration||form.type_of_inspiration||"",
    design_type:api.design_type||form.design_type||"",
    toe_shape:api.toe_shape||form.toe_shape||"",
    closure_type:api.closure_type||form.closure_type||"",
    tags:api.tags||form.tags||"",
    design_elements:api.design_elements||form.design_elements||"",
    construction_notes:api.construction_notes||form.construction_notes||"",
    ai_search_summary:api.ai_search_summary||form.ai_search_summary||"",
    inspiration_status:api.inspiration_status||"Ready for AI"
  };
}
function InspirationAiAssistant({form,setForm}){
  const hasImage=String(form.image_url||"").trim();
  const[analyzing,setAnalyzing]=useState(false);
  const[message,setMessage]=useState("");
  const run=async()=>{
    setAnalyzing(true);setMessage("");
    try{
      const draft=await analyzeInspirationFromImage(form);
      setForm(f=>({...f,...draft}));
      setMessage("AI vision analyzed the image. Review suggested design fields, then save.");
    }catch(e){setMessage(e?.message||"Could not analyze image.");}
    finally{setAnalyzing(false);}
  };
  return <div style={{border:`1px solid ${C.border}`,background:"#FFF8E8",padding:14,marginBottom:18}}>
    <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12}}>
      <div>
        <p style={{margin:0,color:C.text,fontSize:13,fontWeight:900,textTransform:"uppercase",letterSpacing:"0.07em"}}><i className="ti ti-robot" style={{marginRight:7,color:C.accent}}/>AI Inspiration Recognition</p>
        <p style={{margin:"6px 0 0",color:C.sub,fontSize:12,lineHeight:1.55}}>Upload an inspiration image, then click Analyze. This uses the real /api/ai-recognize vision backend to read the uploaded image. It will not guess if the backend is missing.</p>
      </div>
      <button type="button" onClick={run} disabled={analyzing||!hasImage} style={{background:C.accent,border:"none",color:"#111",padding:"9px 13px",fontSize:12,fontWeight:800,cursor:analyzing||!hasImage?"not-allowed":"pointer",whiteSpace:"nowrap",opacity:(analyzing||!hasImage)?0.7:1}}>
        <i className="ti ti-sparkles" style={{marginRight:6}}/>{analyzing?"Analyzing…":"Analyze Image"}
      </button>
    </div>
    {!hasImage&&<p style={{margin:"8px 0 0",color:"#92400E",fontSize:11,lineHeight:1.45}}>Upload the inspiration image first. Add a short tag or note when you know the style; it improves the draft.</p>}
    {message&&<p style={{margin:"8px 0 0",color:"#15803D",fontSize:11,lineHeight:1.45}}>{message}</p>}
  </div>;
}

function RecordModal({item,modId,onClose,onSave,saving,tok}){
  const secs=SECTIONS[modId];
  const[form,setForm]=useState(()=>{
    const rec=item?{...item}:{};
    if(modId==="putha")return {...rec,putha_status:rec.putha_status??rec.status};
    if(modId==="laser_sole")return {...rec,sole_status:rec.sole_status??rec.status,sole_thickness_type:rec.sole_thickness_type??rec.thickness,sole_design_type:rec.sole_design_type??rec.type};
    if(modId==="rubber_laser")return {...rec,rubber_status:rec.rubber_status??rec.status};
    if(modId==="elastic")return {...rec,elastic_status:rec.elastic_status??rec.status};
    if(modId==="thread")return {...rec,thread_type:rec.thread_type??rec.type,thread_status:rec.thread_status??rec.status};
    if(modId==="sooti")return {...rec,sooti_color:rec.sooti_color??rec.color,sooti_status:rec.sooti_status??rec.status};
    if(modId==="income")return {...rec,income_unit_type:rec.income_unit_type??rec.unit_type};
    if(modId==="polish")return {...rec,polish_color:rec.polish_color??rec.color,polish_company:rec.polish_company??rec.company,polish_type:rec.polish_type??rec.type,polish_weight_size:rec.polish_weight_size??rec.weight_size,polish_status:rec.polish_status??rec.status};
    if(modId==="finishing")return {...rec,dye_color:rec.dye_color??rec.color,dye_status:rec.dye_status??rec.status};
    if(modId==="mek")return {...rec,mek_status:rec.mek_status??rec.status};
    if(modId==="leather_board")return {...rec,leather_board_status:rec.leather_board_status??rec.status};
    if(modId==="heel_tops")return {...rec,heel_top_type:rec.heel_top_type??rec.type,heel_top_status:rec.heel_top_status??rec.status};
    if(modId==="sole_sheets")return {...rec,sole_sheet_status:rec.sole_sheet_status??rec.status};
    if(modId==="heels")return {...rec,heel_thickness:rec.heel_thickness??rec.thickness,heel_thickness_type:rec.heel_thickness_type??rec.thickness_type};
    return rec;
  });
  if(!secs)return null;
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const activeType=form.work_order_type||item?.work_order_type||"";
  const visibleSecs=modId==="work_orders"?secs.filter(sec=>!sec.showFor||sec.showFor.includes(activeType)).filter(sec=>!["Material Usage Control","Follow-up Links","Upper Quality Gate","Bottom Quality Gate","Finish Quality Gate","Full Pair Quality Section"].includes(sec.t)):secs;
  return <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:20}}>
    <div style={{background:"#FFFFFF",border:`1px solid ${C.borderL}`,borderRadius:0,boxShadow:"0 8px 32px rgba(0,0,0,0.12)",width:"min(700px,100%)",maxHeight:"90vh",display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"15px 22px",borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
        <div>
          <p style={{color:C.sub,fontSize:10,textTransform:"uppercase",letterSpacing:"0.08em",margin:0,fontWeight:600}}>{ALL_NAV.find(i=>i.id===modId)?.l||modId}</p>
          <h3 style={{color:C.text,fontSize:16,fontWeight:600,margin:"2px 0 0"}}>{item?.id?"Edit Record":"New Record"}</h3>
        </div>
        <button onClick={onClose} style={{background:"none",border:`1px solid ${C.border}`,color:C.sub,cursor:"pointer",padding:"5px 9px",borderRadius:0}}><i className="ti ti-x" style={{fontSize:15}}/></button>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:22}}>
        {modId==="work_orders"&&<div style={{border:`1px solid ${C.border}`,background:"#FFF8E8",padding:14,marginBottom:18}}>
          <label style={{display:"block",color:C.sub,fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:8}}>Start Here — Work Order Type</label>
          <select value={activeType} onChange={e=>{const t=e.target.value;setForm(f=>({...f,work_order_type:t,department:workOrderDepartment(t),order_scope:t==="Order Local"?"Local Pakistan Order":t==="International Order"?"International Order":f.order_scope,work_order_status:f.work_order_status||"Pending"}));}} style={{...C.inp,borderColor:C.accent,fontWeight:700,fontSize:14,appearance:"none",backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24'%3E%3Cpath fill='%23604830' d='M7 10l5 5 5-5z'/%3E%3C/svg%3E")`,backgroundRepeat:"no-repeat",backgroundPosition:"right 10px center"}}>
            <option value="">— Select Work Order Type —</option>
            {WORK_ORDER_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
          </select>
          {!activeType&&<p style={{margin:"8px 0 0",color:C.sub,fontSize:12,lineHeight:1.5}}>Select a Work Order Type first. The popup will then show linked fields for Upper, Bottom, Finish, Local Order, or International Order.</p>}
        </div>}
        {modId==="work_orders"&&activeType&&<WorkOrderActionCenter form={form} setForm={setForm} onSave={onSave} saving={saving} tok={tok}/>}
        {modId==="patterns"&&<LaserPatternAiAssistant form={form} setForm={setForm}/>}
        {modId==="inspiration"&&<InspirationAiAssistant form={form} setForm={setForm}/>}
        {visibleSecs.map((sec,si)=>{
          const resolvedFields=sec.f.filter(f=>!(modId==="work_orders"&&shouldHideWorkOrderField(sec.t,f.k,form))).filter(f=>!(modId==="customers"&&shouldHideCustomerField(sec.t,f.k,form))).map(f=>resolveField(f.k,f.l));
          return <div key={si} style={{marginBottom:24}}>
            <p style={{color:C.accent,fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em",margin:"0 0 12px",paddingBottom:8,borderBottom:`2px solid ${C.accentD}`}}>{sec.t}</p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px 16px"}}>
              {resolvedFields.map(f=>{
                const full=["img","rel","long","bool"].includes(f.t)||f.k==="id"||f.k==="balance_payment";
                return <div key={f.k} style={{gridColumn:full?"1/-1":"auto"}}>
                  <label style={{display:"block",color:C.sub,fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:6}}>{f.l}</label>
                  <FormField fk={f.k} label={f.l} value={form[f.k]} onChange={v=>{
                    if(modId==="work_orders"&&f.k==="sole_material_choice") setForm(prev=>({...prev,sole_material_choice:v,leather_sole_id:v==="Leather Sole"?prev.leather_sole_id:"",rubber_sole_id:v==="Rubber Sole"?prev.rubber_sole_id:""}));
                    else if(modId==="work_orders"&&f.k==="is_sooti_used") setForm(prev=>({...prev,is_sooti_used:v,sooti_half_full:v==="Yes"?prev.sooti_half_full:"",sooti_welt_id:v==="Yes"?prev.sooti_welt_id:""}));
                    else if(modId==="customers"&&f.k==="customer_size_mode") setForm(prev=>({...prev,customer_size_mode:v,size:v==="Generic Size"?prev.size:"",unit:v==="Provided Measurement"?(prev.unit||"Centimeter"):"",point_a:v==="Provided Measurement"?prev.point_a:"",point_b:v==="Provided Measurement"?prev.point_b:"",point_c:v==="Provided Measurement"?prev.point_c:"",point_d:v==="Provided Measurement"?prev.point_d:"",point_e:v==="Provided Measurement"?prev.point_e:""}));
                    else set(f.k,v);
                  }} sbUrl={SB_URL} tok={tok} allData={form}/>
                </div>;
              })}
            </div>
          </div>;
        })}
      </div>
      <div style={{display:"flex",gap:10,padding:"16px 22px",borderTop:`1px solid ${C.border}`,justifyContent:"flex-end",background:"#F8F8F6",flexShrink:0}}>
        <button onClick={onClose} style={{background:"none",border:`1px solid ${C.border}`,color:C.sub,borderRadius:0,padding:"9px 20px",cursor:"pointer",fontSize:13}}>Cancel</button>
        <button onClick={()=>onSave(form)} disabled={saving} style={{background:C.accent,border:"none",color:"#111111",borderRadius:0,padding:"9px 24px",cursor:saving?"wait":"pointer",fontSize:13,fontWeight:600,opacity:saving?0.7:1}}>{saving?"Saving…":"Save Record"}</button>
      </div>
    </div>
  </div>;
}


// ── KPI Config — context-aware per table ─────────────────────
const KPI_CONFIG={
  work_orders:rows=>{
    const open=rows.filter(r=>!(r.is_done===true||r.is_done==="true")&&String(r.work_order_status||"").toLowerCase()!=="completed").length;
    const inProgress=rows.filter(r=>String(r.work_order_status||"").toLowerCase().includes("progress")).length;
    const dueSoon=rows.filter(r=>{if(!r.due_date)return false;const d=new Date(r.due_date);const now=new Date();const diff=(d-now)/(1000*60*60*24);return diff>=0&&diff<=7&&String(r.work_order_status||"").toLowerCase()!=="completed";}).length;
    const done=rows.filter(r=>r.is_done===true||r.is_done==="true"||String(r.work_order_status||"").toLowerCase()==="completed").length;
    return[{l:"Open WOs",v:open,i:"ti-clipboard-list",c:"#DC2626"},
      {l:"In Progress",v:inProgress,i:"ti-loader",c:"#92400E"},
      {l:"Due Soon",v:dueSoon,i:"ti-calendar-time",c:C.accent},
      {l:"Completed",v:done,i:"ti-circle-check",c:"#15803D"}];
  },
  material_usage:rows=>{
    const reserved=rows.filter(r=>String(r.usage_status||"").toLowerCase()==="reserved").length;
    const consumed=rows.filter(r=>String(r.usage_status||"").toLowerCase()==="consumed").length;
    const cats=new Set(rows.map(r=>r.material_category).filter(Boolean)).size;
    return[{l:"Usage Rows",v:rows.length,i:"ti-list-details",c:C.sub},{l:"Reserved",v:reserved,i:"ti-lock",c:"#D97706"},{l:"Consumed",v:consumed,i:"ti-check",c:"#15803D"},{l:"Categories",v:cats,i:"ti-category",c:C.accent}];
  },
  customers:rows=>{
    const pak=rows.filter(r=>String(r.country||"").trim().toLowerCase()==="pakistan").length;
    const rest=rows.filter(r=>String(r.country||"").trim()&&String(r.country||"").trim().toLowerCase()!=="pakistan").length;
    const active=rows.filter(r=>!["Delivered","Returned"].includes(String(r.delivery_status||"").trim())&&String(r.delivery_status||"").trim()).length;
    return[{l:"Total Customers",v:rows.length,i:"ti-users",c:C.sub},
      {l:"Pakistan",v:pak,i:"ti-map-pin",c:"#15803D"},
      {l:"Rest of World",v:rest,i:"ti-world",c:"#1D4ED8"},
      active>0&&{l:"Active Orders",v:active,i:"ti-clock",c:"#D97706"},
    ].filter(Boolean);
  },
  inventory:rows=>{
    const norm=v=>String(v||"").trim().toLowerCase();
    const available=rows.filter(r=>norm(r.status)==="available"||norm(r.status)==="in stock").length;
    const complete=rows.filter(r=>norm(r.finish_status)==="complete finish"||norm(r.finish_status)==="completed finish").length;
    const unfinished=rows.filter(r=>!present(r.finish_status)||["unfinished","unfinish","in progress","sole regrai","upper finish","bottom finish","refinish"].includes(norm(r.finish_status))).length;
    return[{l:"Total Pairs",v:rows.length,i:"ti-package",c:C.sub},
      {l:"Available",v:available,i:"ti-circle-check",c:"#15803D"},
      {l:"Complete Finish",v:complete,i:"ti-rosette-discount-check",c:C.accent},
      {l:"Unfinished / Active",v:unfinished,i:"ti-loader",c:"#D97706"},
    ];
  },
  laser_sole:rows=>{
    const norm=v=>String(v||"").trim().toLowerCase();
    const available=rows.filter(r=>norm(r.status)==="available").length;
    const consumed=rows.filter(r=>norm(r.status)==="consumed").length;
    const sizes=new Set(rows.map(r=>String(r.size||"").trim()).filter(Boolean)).size;
    return[{l:"Total Soles",v:rows.length,i:"ti-shoe",c:C.sub},
      {l:"Available",v:available,i:"ti-circle-check",c:"#15803D"},
      {l:"Consumed",v:consumed,i:"ti-arrow-down",c:"#DC2626"},
      {l:"Sizes",v:sizes,i:"ti-ruler",c:C.accent},
    ];
  },
  polish:rows=>{
    const norm=v=>String(v||"").trim().toLowerCase();
    const inStock=rows.filter(r=>norm(r.status)==="in stock").length;
    const nearEnd=rows.filter(r=>norm(r.status).includes("near")).length;
    const companies=new Set(rows.map(r=>String(r.company||"").trim()).filter(Boolean)).size;
    return[{l:"Polish Items",v:rows.length,i:"ti-circle",c:C.sub},
      {l:"In Stock",v:inStock,i:"ti-circle-check",c:"#15803D"},
      {l:"Near End",v:nearEnd,i:"ti-alert-triangle",c:nearEnd?"#DC2626":C.accent},
      {l:"Companies",v:companies,i:"ti-building-store",c:C.accent},
    ];
  },
  finishing:rows=>{
    const norm=v=>String(v||"").trim().toLowerCase();
    const inStock=rows.filter(r=>norm(r.status)==="in stock").length;
    const nearEnd=rows.filter(r=>norm(r.status).includes("near")).length;
    const colorCount=new Set(rows.map(r=>String(r.color||"").trim()).filter(Boolean)).size;
    return[{l:"Dye Colors",v:rows.length,i:"ti-palette",c:C.sub},
      {l:"In Stock",v:inStock,i:"ti-circle-check",c:"#15803D"},
      {l:"Near End",v:nearEnd,i:"ti-alert-triangle",c:nearEnd?"#DC2626":C.accent},
      {l:"Color Names",v:colorCount,i:"ti-color-swatch",c:C.accent},
    ];
  },
  mek:rows=>{
    const norm=v=>String(v||"").trim().toLowerCase();
    const inStock=rows.filter(r=>norm(r.status)==="in stock").length;
    const nearEnd=rows.filter(r=>norm(r.status).includes("near")).length;
    const thicknessTypes=new Set(rows.map(r=>String(r.thickness||"").trim()).filter(Boolean)).size;
    return[{l:"Total MEK Sheets",v:rows.length,i:"ti-stack-2",c:C.sub},
      {l:"In Stock",v:inStock,i:"ti-circle-check",c:"#15803D"},
      {l:"Near End",v:nearEnd,i:"ti-alert-triangle",c:nearEnd?"#DC2626":C.accent},
      {l:"Thickness Types",v:thicknessTypes,i:"ti-ruler",c:C.accent},
    ];
  },
  leather_board:rows=>{
    const norm=v=>String(v||"").trim().toLowerCase();
    const inStock=rows.filter(r=>norm(r.status)==="in stock").length;
    const nearEnd=rows.filter(r=>norm(r.status).includes("near")).length;
    return[{l:"Total Boards",v:rows.length,i:"ti-square-half",c:C.sub},
      {l:"In Stock",v:inStock,i:"ti-circle-check",c:"#15803D"},
      {l:"Near End",v:nearEnd,i:"ti-alert-triangle",c:nearEnd?"#DC2626":C.accent},
    ];
  },
  heel_tops:rows=>{
    const types=new Set(rows.map(r=>String(r.type||"").trim()).filter(Boolean)).size;
    const norm=v=>String(v||"").trim().toLowerCase();
    const inStock=rows.filter(r=>norm(r.status)==="in stock").length;
    const nearEnd=rows.filter(r=>norm(r.status).includes("near")).length;
    return[{l:"Total Tapi",v:rows.length,i:"ti-triangle-inverted",c:C.sub},
      {l:"Types",v:types,i:"ti-category",c:C.accent},
      {l:"In Stock",v:inStock,i:"ti-circle-check",c:"#15803D"},
      {l:"Near End",v:nearEnd,i:"ti-alert-triangle",c:nearEnd?"#DC2626":C.accent},
    ];
  },
  sole_sheets:rows=>{
    const norm=v=>String(v||"").trim().toLowerCase();
    const inStock=rows.filter(r=>norm(r.status)==="in stock").length;
    const nearEnd=rows.filter(r=>norm(r.status).includes("near")).length;
    const types=new Set(rows.map(r=>String(r.name||"").trim()).filter(Boolean)).size;
    return[{l:"Total Sole Sheets",v:rows.length,i:"ti-stack-2",c:C.sub},
      {l:"In Stock",v:inStock,i:"ti-circle-check",c:"#15803D"},
      {l:"Near End",v:nearEnd,i:"ti-alert-triangle",c:nearEnd?"#DC2626":C.accent},
      {l:"Types",v:types,i:"ti-category",c:C.accent},
    ];
  },
  heels:rows=>{
    const types=new Set(rows.map(r=>String(r.heel_type||"").trim()).filter(Boolean)).size;
    const thicknessTypes=new Set(rows.map(r=>String(r.thickness_type||"").trim()).filter(Boolean)).size;
    return[{l:"Total Heels",v:rows.length,i:"ti-triangle",c:C.sub},
      {l:"Heel Types",v:types,i:"ti-category",c:C.accent},
      {l:"Thickness Types",v:thicknessTypes,i:"ti-ruler",c:"#15803D"},
    ];
  },
  rubber_laser:rows=>{
    const norm=v=>String(v||"").trim().toLowerCase();
    const available=rows.filter(r=>norm(r.status)==="available").length;
    const consumed=rows.filter(r=>norm(r.status)==="consumed").length;
    const sizes=new Set(rows.map(r=>String(r.size||"").trim()).filter(Boolean)).size;
    return[{l:"Total Rubber Soles",v:rows.length,i:"ti-shoe",c:C.sub},
      {l:"Available",v:available,i:"ti-circle-check",c:"#15803D"},
      {l:"Consumed",v:consumed,i:"ti-arrow-down",c:"#DC2626"},
      {l:"Sizes",v:sizes,i:"ti-ruler",c:C.accent},
    ];
  },
  putha:rows=>{
    const inStock=rows.filter(r=>String(r.status||"").toLowerCase()==="in stock").length;
    const nearEnd=rows.filter(r=>String(r.status||"").toLowerCase().includes("near")).length;
    return[{l:"Total Putha",v:rows.length,i:"ti-layers-intersect",c:C.sub},
      {l:"In Stock",v:inStock,i:"ti-circle-check",c:"#15803D"},
      {l:"Near End",v:nearEnd,i:"ti-alert-triangle",c:nearEnd?"#DC2626":C.accent},
    ];
  },
  thread:rows=>{
    const nearEnd=rows.filter(r=>String(r.status||"").toLowerCase().includes("near")||String(r.status||"").toLowerCase().includes("low")).length;
    return[{l:"Thread Records",v:rows.length,i:"ti-tornado",c:C.sub},
      {l:"Near End",v:nearEnd,i:"ti-alert-triangle",c:nearEnd?"#DC2626":C.accent},
    ];
  },
  elastic:rows=>{
    const meters=rows.reduce((s,r)=>s+(Number(r.size_meters)||0),0);
    return[{l:"Elastic Records",v:rows.length,i:"ti-wave-sine",c:C.sub},
      {l:"Total Meters",v:meters,i:"ti-ruler",c:C.accent},
    ];
  },
  laces:rows=>{
    const types=new Set(rows.map(r=>String(r.lace_type||"").trim()).filter(Boolean)).size;
    const qty=rows.reduce((s,r)=>s+(Number(r.quantity)||0),0);
    return[{l:"Lace Types",v:types,i:"ti-link",c:C.sub},
      {l:"Total Qty",v:qty,i:"ti-layers-subtract",c:C.accent},
    ];
  },
  buckles:rows=>{
    const colors=new Set(rows.map(r=>String(r.color||"").trim()).filter(Boolean)).size;
    const qty=rows.reduce((s,r)=>s+(Number(r.quantity)||0),0);
    return[{l:"Buckle Types",v:colors,i:"ti-link",c:C.sub},
      {l:"Total Qty",v:qty,i:"ti-layers-subtract",c:C.accent},
    ];
  },
  lining_leather:rows=>{
    const colors=new Set(rows.map(r=>inferLeatherColor(r)).filter(Boolean)).size;
    return[{l:"Total Lining",v:rows.length,i:"ti-layers-intersect",c:C.sub},
      {l:"Colors",v:colors,i:"ti-palette",c:C.accent},
    ];
  },
  farma:rows=>{
    const men=rows.filter(r=>["101","201","301","401","501","601","1","2","3","4","5","6"].includes(String(r.option_no||"").trim().toLowerCase())).length;
    const ladies=rows.filter(r=>upperRowMatchesFarma(r,"7")||upperRowMatchesFarma(r,"8")).length;
    const photos=rows.filter(r=>present(r.image_url)).length;
    return[{l:"Farma Types",v:rows.length,i:"ti-ruler-2",c:C.sub},
      {l:"Men Lasts",v:men,i:"ti-shoe",c:C.accent},
      {l:"Ladies Lasts",v:ladies,i:"ti-flower",c:"#1D4ED8"},
      {l:"With Photos",v:photos,i:"ti-photo",c:"#15803D"},
    ];
  },
  uppers:rows=>{
    const avail=rows.filter(r=>boolYes(r.available)||String(r.status||"").trim().toLowerCase()==="ready").length;
    const paitawa=rows.filter(r=>boolYes(r.paitava_available)||String(r.paitava_available||"").trim().toLowerCase()==="yes").length;
    const ip=rows.filter(r=>String(r.status||"").trim().toLowerCase().includes("progress")).length;
    return[{l:"Total Uppers",v:rows.length,i:"ti-stack",c:C.sub},
      {l:"Available",v:avail,i:"ti-circle-check",c:"#15803D"},
      {l:"Paitawa Ready",v:paitawa,i:"ti-shield-check",c:C.accent},
      {l:"In Progress",v:ip,i:"ti-clock",c:"#D97706"},
    ].filter(Boolean);
  },
  expenses:rows=>{
    const totalD=rows.reduce((s,r)=>s+(Number(r.debit)||0),0);
    const totalC=rows.reduce((s,r)=>s+(Number(r.credit)||0),0);
    const bal=totalD-totalC;
    return[{l:"Ledger Entries",v:rows.length,i:"ti-list",c:C.sub},
      {l:"Debit",v:"₨"+totalD.toLocaleString(),i:"ti-arrow-up",c:"#15803D"},
      {l:"Credit",v:"₨"+totalC.toLocaleString(),i:"ti-arrow-down",c:"#DC2626"},
      {l:"Petty Cash Balance",v:"₨"+bal.toLocaleString(),i:"ti-scale",c:bal>=0?"#15803D":"#DC2626"},
    ].filter(Boolean);
  },
  patterns:rows=>{
    const withImages=rows.filter(r=>String(r.image_url||"").trim()).length;
    const ready=rows.filter(r=>String(r.laser_pattern_status||"").toLowerCase()==="ready for ai").length;
    const types=new Set(rows.map(r=>String(r.pattern_type||"").trim()).filter(Boolean)).size;
    const leatherTypes=new Set(rows.map(r=>String(r.upper_leather_type||"").trim()).filter(Boolean)).size;
    return[{l:"Patterns",v:rows.length,i:"ti-vector",c:C.sub},
      {l:"Pattern Types",v:types,i:"ti-grid-dots",c:C.accent},
      {l:"Leather Types",v:leatherTypes,i:"ti-shirt",c:"#2563EB"},
      {l:"Ready for AI",v:ready,i:"ti-robot",c:"#15803D"},
      {l:"With Images",v:withImages,i:"ti-photo-check",c:"#15803D"},
    ].filter(Boolean);
  },
  inspiration:rows=>{
    const withImages=rows.filter(r=>String(r.image_url||"").trim()).length;
    const ready=rows.filter(r=>String(r.inspiration_status||"").toLowerCase()==="ready for ai").length;
    const types=new Set(rows.map(r=>String(r.type_of_inspiration||"").trim()).filter(Boolean)).size;
    const designs=new Set(rows.map(r=>String(r.design_type||"").trim()).filter(Boolean)).size;
    return[{l:"References",v:rows.length,i:"ti-photo",c:C.sub},
      {l:"Inspiration Types",v:types,i:"ti-palette",c:C.accent},
      {l:"Design Types",v:designs,i:"ti-scissors",c:"#2563EB"},
      {l:"Ready for AI",v:ready,i:"ti-robot",c:"#15803D"},
      {l:"With Images",v:withImages,i:"ti-photo-check",c:"#15803D"},
    ].filter(Boolean);
  },
  sops:rows=>{
    const cats=new Set(rows.map(r=>String(r.rule_category||"").trim()).filter(Boolean)).size;
    const complete=rows.filter(r=>String(r.rule_category||"").trim()&&String(r.rule_description||"").trim()).length;
    const missing=rows.length-complete;
    return[{l:"SOP Entries",v:rows.length,i:"ti-book",c:C.sub},
      {l:"Categories",v:cats,i:"ti-folder",c:C.accent},
      {l:"Complete",v:complete,i:"ti-circle-check",c:"#15803D"},
      {l:"Missing Info",v:missing,i:"ti-alert-triangle",c:missing?"#DC2626":C.accent},
    ].filter(Boolean);
  },
  rules:rows=>{
    const active=rows.filter(r=>r.is_active===true||String(r.is_active).toLowerCase()==="true"||String(r.is_active).toLowerCase()==="yes").length;
    const cats=new Set(rows.map(r=>String(r.rule_category||"").trim()).filter(Boolean)).size;
    return[{l:"Rules",v:rows.length,i:"ti-gavel",c:C.sub},
      {l:"Active",v:active,i:"ti-circle-check",c:"#15803D"},
      {l:"Categories",v:cats,i:"ti-category",c:C.accent},
    ].filter(Boolean);
  },
  income:rows=>{
    const total=rows.reduce((s,r)=>s+(Number(r.amount_received)||0),0);
    const full=rows.filter(r=>r.payment_type==="Full Payment").length;
    const adv=rows.filter(r=>r.payment_type==="Advance").length;
    return[{l:"Records",v:rows.length,i:"ti-receipt",c:C.sub},
      {l:"Total Received",v:"₨"+total.toLocaleString(),i:"ti-coin",c:"#15803D"},
      full>0&&{l:"Full Payments",v:full,i:"ti-circle-check",c:C.accent},
      adv>0&&{l:"Advances",v:adv,i:"ti-clock",c:"#D97706"},
    ].filter(Boolean);
  },
  tools:rows=>{
    const avail=rows.filter(r=>r.status==="Available").length;
    const asgn=rows.filter(r=>r.status==="Assigned").length;
    const repair=rows.filter(r=>r.status==="Under Repair").length;
    return[{l:"Total Tools",v:rows.length,i:"ti-tool",c:C.sub},
      {l:"Available",v:avail,i:"ti-circle-check",c:"#15803D"},
      asgn>0&&{l:"Assigned",v:asgn,i:"ti-user",c:"#1D4ED8"},
      repair>0&&{l:"Under Repair",v:repair,i:"ti-alert-triangle",c:"#DC2626"},
    ].filter(Boolean);
  },
  faults:rows=>{
    const open=rows.filter(r=>r.fault_status==="Open").length;
    const crit=rows.filter(r=>r.is_critical===true||r.is_critical==="true").length;
    const resolved=rows.filter(r=>r.fault_status==="Resolved"||r.fault_status==="Closed").length;
    return[{l:"Total Faults",v:rows.length,i:"ti-alert-triangle",c:C.sub},
      open>0&&{l:"Open",v:open,i:"ti-clock",c:"#DC2626"},
      crit>0&&{l:"Critical",v:crit,i:"ti-alert",c:"#9B1C1C"},
      resolved>0&&{l:"Resolved",v:resolved,i:"ti-circle-check",c:"#15803D"},
    ].filter(Boolean);
  },
  production:rows=>{
    const ip=rows.filter(r=>r.status==="In Progress").length;
    const plan=rows.filter(r=>r.status==="Planning").length;
    const done=rows.filter(r=>r.status==="Completed").length;
    const hi=rows.filter(r=>r.priority==="High").length;
    return[{l:"Total Plans",v:rows.length,i:"ti-calendar",c:C.sub},
      plan>0&&{l:"Planning",v:plan,i:"ti-pencil",c:"#1D4ED8"},
      ip>0&&{l:"In Progress",v:ip,i:"ti-clock",c:"#D97706"},
      done>0&&{l:"Completed",v:done,i:"ti-circle-check",c:"#15803D"},
      hi>0&&{l:"High Priority",v:hi,i:"ti-flame",c:"#DC2626"},
    ].filter(Boolean);
  },
};
// More table KPIs
KPI_CONFIG.upper_leather=rows=>{
  const patterns=new Set(rows.map(r=>r.type_pattern).filter(present).map(String)).size;
  const withImg=rows.filter(r=>present(r.image_url)).length;
  const withVideo=rows.filter(r=>present(r.video_url)).length;
  const sqft=rows.reduce((s,r)=>s+(Number(r.size_unit_sqft)||0),0);
  return[{l:"Total Leather",v:rows.length,i:"ti-layers",c:C.sub},
    patterns>0&&{l:"Pattern Types",v:patterns,i:"ti-tags",c:C.accent},
    withImg>0&&{l:"With Photos",v:withImg,i:"ti-photo",c:"#15803D"},
    withVideo>0&&{l:"With Video",v:withVideo,i:"ti-video",c:"#1D4ED8"},
    sqft>0&&{l:"Total Sq Ft",v:sqft.toFixed(1),i:"ti-ruler",c:C.accent},
  ].filter(Boolean);
};
KPI_CONFIG.buckles=rows=>{
  const tot=rows.reduce((s,r)=>s+(Number(r.quantity)||0),0);
  const val=rows.reduce((s,r)=>s+(Number(r.unit_price)||0)*(Number(r.quantity)||0),0);
  return[{l:"Types",v:rows.length,i:"ti-link",c:C.sub},
    tot>0&&{l:"Total Qty",v:tot,i:"ti-stack",c:C.accent},
    val>0&&{l:"Stock Value",v:"₨"+val.toLocaleString(),i:"ti-coin",c:"#15803D"},
  ].filter(Boolean);
};
KPI_CONFIG.laces=KPI_CONFIG.buckles;
KPI_CONFIG.heels=rows=>[{l:"Heel Types",v:rows.length,i:"ti-triangle",c:C.sub}];
KPI_CONFIG.heel_tops=rows=>{
  const normType=v=>{const s=String(v||"").toLowerCase();if(s.includes("moti"))return "Moti";if(s.includes("patli")||s.includes("patlee"))return "Patli";if(s.includes("laser"))return "With Laser";if(s.includes("plain"))return "Plain without Laser";return String(v||"").trim();};
  const types=new Set(rows.map(r=>normType(r.type)).filter(Boolean));
  const withImg=rows.filter(r=>present(r.image_url)).length;
  return[{l:"Heel Tops",v:rows.length,i:"ti-triangle-inverted",c:C.sub},
    types.size>0&&{l:"Types",v:types.size,i:"ti-tags",c:C.accent},
    withImg>0&&{l:"With Images",v:withImg,i:"ti-photo",c:"#15803D"}].filter(Boolean);
};
KPI_CONFIG.sooti=rows=>{
  const tot=rows.reduce((s,r)=>s+(Number(r.quantity_inches)||0),0);
  const instock=rows.filter(r=>r.status==="In Stock"||r.status==="Available").length;
  return[{l:"Types",v:rows.length,i:"ti-wave-square",c:C.sub},
    tot>0&&{l:"Total Inches",v:tot.toFixed(0),i:"ti-ruler",c:C.accent},
    instock>0&&{l:"In Stock",v:instock,i:"ti-circle-check",c:"#15803D"}].filter(Boolean);
};
KPI_CONFIG.thread=rows=>{
  const avail=rows.filter(r=>r.status==="Available").length;
  return[{l:"Colors",v:rows.length,i:"ti-tornado",c:C.sub},
    avail>0&&{l:"Available",v:avail,i:"ti-circle-check",c:"#15803D"}].filter(Boolean);
};
KPI_CONFIG.lining_leather=rows=>{
  const colors=new Set(rows.map(r=>r.color).filter(Boolean)).size;
  const withImg=rows.filter(r=>present(r.image_url)).length;
  const withVideo=rows.filter(r=>present(r.video_url)).length;
  return[{l:"Lining Pieces",v:rows.length,i:"ti-layers",c:C.sub},
    colors>0&&{l:"Colors",v:colors,i:"ti-palette",c:C.accent},
    withImg>0&&{l:"With Images",v:withImg,i:"ti-photo",c:"#15803D"},
    withVideo>0&&{l:"With Video",v:withVideo,i:"ti-video",c:"#2563EB"}].filter(Boolean);
};
KPI_CONFIG.farma=rows=>{
  const sizes=new Set(rows.map(r=>r.size).filter(Boolean)).size;
  return[{l:"Farma Types",v:rows.length,i:"ti-shoe",c:C.sub},
    sizes>0&&{l:"Size Range",v:sizes+" sizes",i:"ti-ruler",c:C.accent}].filter(Boolean);
};
KPI_CONFIG.belts=rows=>{
  const avail=rows.filter(r=>r.status==="Available").length;
  const qty=rows.reduce((s,r)=>s+(Number(r.quantity)||0),0);
  const val=rows.reduce((s,r)=>s+(Number(r.unit_price)||0)*(Number(r.quantity)||0),0);
  return[{l:"Belt Types",v:rows.length,i:"ti-rectangle",c:C.sub},
    qty>0&&{l:"Total Qty",v:qty,i:"ti-stack",c:C.accent},
    avail>0&&{l:"Available",v:avail,i:"ti-circle-check",c:"#15803D"},
    val>0&&{l:"Stock Value",v:"₨"+val.toLocaleString(),i:"ti-coin",c:"#D97706"},
  ].filter(Boolean);
};
KPI_CONFIG.putha=KPI_CONFIG.upper_leather;
KPI_CONFIG.laser_sole=rows=>{
  const qtyOf=r=>Number(r.available_quantity??r.stock_count??r.quantity??0)||0;
  const totalQty=rows.reduce((s,r)=>s+qtyOf(r),0);
  const norm=v=>String(v||"").toLowerCase();
  const consumed=rows.reduce((s,r)=>{
    const st=norm(r.status);
    return s+((st.includes("used")||st.includes("consume")||st.includes("sold")||st.includes("out of stock"))?qtyOf(r):0);
  },0);
  const available=rows.reduce((s,r)=>{
    const st=norm(r.status);
    return s+((st.includes("available")||st.includes("in stock")||!present(r.status))?qtyOf(r):0);
  },0);
  const sizes=new Set(rows.map(r=>r.size).filter(present).map(String)).size;
  return[
    {l:"Sizes",v:sizes||rows.length,i:"ti-ruler",c:C.sub},
    {l:"Total Qty",v:totalQty,i:"ti-stack",c:C.accent},
    {l:"Available",v:available,i:"ti-circle-check",c:"#15803D"},
    {l:"Consumed",v:consumed,i:"ti-arrow-down",c:"#DC2626"},
  ].filter(Boolean);
};
KPI_CONFIG.rubber_laser=KPI_CONFIG.laser_sole;
KPI_CONFIG.sole_sheets=rows=>[{l:"Sheet Types",v:rows.length,i:"ti-stack-2",c:C.sub}];
KPI_CONFIG.mek=rows=>{
  const qty=rows.reduce((s,r)=>s+(Number(r.quantity)||0),0);
  const thicknessTypes=new Set(rows.map(r=>r.thickness).filter(present).map(String)).size;
  const sizeTypes=new Set(rows.map(r=>r.size).filter(present).map(String)).size;
  return[
    {l:"MEK Sheets",v:rows.length,i:"ti-rectangle-vertical",c:C.sub},
    qty>0&&{l:"Total Qty",v:qty,i:"ti-stack",c:C.accent},
    thicknessTypes>0&&{l:"Thickness Types",v:thicknessTypes,i:"ti-ruler",c:"#1D4ED8"},
    sizeTypes>0&&{l:"Size Types",v:sizeTypes,i:"ti-aspect-ratio",c:"#D97706"},
  ].filter(Boolean);
};
KPI_CONFIG.finishing=rows=>{
  return[{l:"Dye Colors",v:rows.length,i:"ti-palette",c:C.sub}];
};
KPI_CONFIG.polish=rows=>{
  const low=rows.filter(r=>Number(r.threshold_alert_level)>0).length;
  return[{l:"Polish Types",v:rows.length,i:"ti-circle",c:C.sub},
    low>0&&{l:"Tracked",v:low,i:"ti-bell",c:C.accent}].filter(Boolean);
};
KPI_CONFIG.solution=rows=>[{l:"Solutions",v:rows.length,i:"ti-droplet",c:C.sub}];
KPI_CONFIG.leather_board=rows=>{
  const sheets=rows.reduce((s,r)=>s+(Number(r.quantity_sheets)||0),0);
  return[{l:"Types",v:rows.length,i:"ti-square-half",c:C.sub},
    sheets>0&&{l:"Total Sheets",v:sheets,i:"ti-stack",c:C.accent}].filter(Boolean);
};
KPI_CONFIG.measurements=rows=>{
  const hasPoints=r=>[r.point_a,r.point_b,r.point_c,r.point_d,r.point_e,r.point_f].some(present);
  const sizeMode=r=>String(r.customer_size_mode||r.customer_size_type||(hasPoints(r)||String(r.size||"").toLowerCase().includes("measurement")?"Provided Measurement":present(r.size)?"Generic Size":"")).trim();
  const provided=rows.filter(r=>sizeMode(r)==="Provided Measurement").length;
  const generic=rows.filter(r=>sizeMode(r)==="Generic Size").length;
  const units=new Set(rows.map(r=>r.unit).filter(present)).size;
  return[
    {l:"Measurements",v:rows.length,i:"ti-ruler",c:C.sub},
    {l:"Provided",v:provided,i:"ti-ruler-measure",c:C.accent},
    {l:"Generic",v:generic,i:"ti-stack",c:"#1D4ED8"},
    units>0&&{l:"Units",v:units,i:"ti-scale",c:"#15803D"},
  ].filter(Boolean);
};
KPI_CONFIG.knowledge=rows=>{
  const cats=new Set(rows.map(r=>r.knowledge_category).filter(present)).size;
  const complete=rows.filter(r=>present(r.knowledge_point)&&present(r.knowledge_category)&&present(r.point_info)).length;
  const missing=rows.length-complete;
  return[
    {l:"Entries",v:rows.length,i:"ti-book",c:C.sub},
    {l:"Categories",v:cats,i:"ti-folder",c:C.accent},
    {l:"Complete",v:complete,i:"ti-circle-check",c:"#15803D"},
    {l:"Missing Info",v:missing,i:"ti-alert-triangle",c:missing?"#DC2626":C.dim},
  ];
};
KPI_CONFIG.inspiration=rows=>{
  const split=v=>String(v||"").split(",").map(x=>x.trim()).filter(Boolean);
  const types=new Set(rows.flatMap(r=>split(r.type_of_inspiration))).size;
  const designs=new Set(rows.flatMap(r=>split(r.design_type))).size;
  const withImages=rows.filter(r=>present(r.image_url)).length;
  return[
    {l:"References",v:rows.length,i:"ti-photo",c:C.sub},
    {l:"Inspiration Types",v:types,i:"ti-palette",c:C.accent},
    {l:"Design Types",v:designs,i:"ti-affiliate",c:"#1D4ED8"},
    {l:"With Images",v:withImages,i:"ti-photo-check",c:"#15803D"},
  ];
};
KPI_CONFIG.videos=rows=>{
  const pub=rows.filter(r=>r.status==="Published").length;
  const linked=rows.filter(r=>present(r.upper_id)||present(r.related_pair_id)||present(r.work_order_id)||present(r.customer_id)).length;
  const missing=rows.length-linked;
  return[
    {l:"Total Videos",v:rows.length,i:"ti-video",c:C.sub},
    {l:"Published",v:pub,i:"ti-circle-check",c:"#15803D"},
    {l:"Linked Videos",v:linked,i:"ti-link",c:"#1D4ED8"},
    {l:"Missing Link",v:missing,i:"ti-alert-triangle",c:missing?"#DC2626":C.dim},
  ];
};
KPI_CONFIG.sops=KPI_CONFIG.knowledge;
KPI_CONFIG.rules=rows=>{
  const active=rows.filter(r=>r.is_active===true||r.is_active==="true").length;
  return[{l:"Rules",v:rows.length,i:"ti-gavel",c:C.sub},
    active>0&&{l:"Active",v:active,i:"ti-circle-check",c:"#15803D"}].filter(Boolean);
};
KPI_CONFIG.patterns=rows=>{
  const types=new Set(rows.map(r=>r.pattern_type).filter(present)).size;
  const leathers=new Set(rows.map(r=>r.upper_leather_type).filter(present)).size;
  const withImages=rows.filter(r=>present(r.image_url)).length;
  return[
    {l:"Patterns",v:rows.length,i:"ti-vector",c:C.sub},
    {l:"Pattern Types",v:types,i:"ti-palette",c:C.accent},
    {l:"Leather Types",v:leathers,i:"ti-layers-intersect",c:"#1D4ED8"},
    {l:"With Images",v:withImages,i:"ti-photo-check",c:"#15803D"},
  ];
};
KPI_CONFIG.elastic=rows=>[{l:"Types",v:rows.length,i:"ti-wave-sine",c:C.sub}];
KPI_CONFIG.extra_saman=rows=>{
  const materialTypes=new Set(rows.map(r=>r.material_type).filter(Boolean)).size;
  const withVideo=rows.filter(r=>present(r.video_url)).length;
  const withMedia=rows.filter(r=>hasMedia(r)).length;
  const missingMaterial=rows.filter(r=>!present(r.material_type)).length;
  return[
    {l:"Total Items",v:rows.length,i:"ti-box",c:C.sub},
    {l:"Material Types",v:materialTypes,i:"ti-category",c:C.accent},
    {l:"With Media",v:withMedia,i:"ti-photo-video",c:"#15803D"},
    {l:"Missing Material",v:missingMaterial,i:"ti-alert-triangle",c:missingMaterial?"#DC2626":C.dim},
  ];
};

// Default KPI for any table not specifically configured
KPI_CONFIG.default=rows=>[{l:"Total Records",v:(rows||[]).length,i:"ti-table",c:C.sub}];

// ── Smart table helpers ─────────────────────────────────────
function present(v){return v!==null&&v!==undefined&&String(v).trim()!=="";}
function boolYes(v){return v===true||v==="true"||v==="Yes"||v===1||v==="1";}
function hasMedia(r){return present(r.image_url)||present(r.video_url);}
function daysOld(v){const d=new Date(v);if(!v||isNaN(d.getTime()))return null;return (Date.now()-d.getTime())/(1000*60*60*24);}
function extraMissingList(r){
  const miss=[];
  if(!present(r.name))miss.push("Name");
  if(!present(r.material_type))miss.push("Material Type");
  if(!present(r.quantity))miss.push("Quantity");
  return miss;
}
function getVirtualValue(row,key){
  if(key==="media_status"){
    const hasPhoto=present(row.image_url),hasVideo=present(row.video_url);
    if(hasPhoto&&hasVideo)return "Photo + Video";
    if(hasPhoto)return "With Photo";
    if(hasVideo)return "With Video";
    return "No Media";
  }
  if(key==="missing_info"){
    const miss=extraMissingList(row);
    return miss.length?miss.join(", "):"Complete";
  }
  return row[key];
}

function splitFilterValues(v){return String(v||"").split(",").map(x=>x.trim()).filter(Boolean);}
function countBySplit(rows,key){
  const counts={};
  rows.forEach(r=>splitFilterValues(r[key]).forEach(v=>{counts[v]=(counts[v]||0)+1;}));
  return counts;
}
function hasSplitValue(row,key,val){return splitFilterValues(row[key]).some(v=>v.toLowerCase()===String(val||"").toLowerCase());}

function isNoisyQuickValue(v){
  const s=String(v||"").trim();
  if(!s)return true;
  if(s.length>48)return true;
  // Hide raw timestamps from quick filters, e.g. 2026-05-26T10:16:09.848456+00:00
  if(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?$/i.test(s))return true;
  if(/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}/i.test(s))return true;
  if(/https?:\/\//i.test(s))return true;
  if(/airtableusercontent|cloudfront/i.test(s))return true;
  if(/\.(jpg|jpeg|png|gif|webp|mp4|mov|avi|heic)(\s|$|\?)/i.test(s))return true;
  if(s.includes("(https://")||s.includes("(http://"))return true;
  return false;
}

// ── Auto Quick Filters — scans actual row data, works for ALL tables ─
function getQuickFilters(modId,cols,rows){
  if(!rows.length)return[];
  if(modId==="sops"){
    // SOPs use clean dropdown filter only.
    return [];
  }
  if(modId==="upper_leather"){
    // Upper Leather uses dedicated dropdown filters only: Type / Pattern and Color.
    return [];
  }
  if(modId==="farma"){
    // Farma uses one fixed dropdown filter only.
    return [];
  }
  if(modId==="lining_leather"){
    // Lining Leather uses one clean Color dropdown filter only.
    return [];
  }

  if(modId==="buckles"){
    // Buckle uses one clean Color dropdown filter only.
    return [];
  }
  if(modId==="laces"){
    // Laces use clean Type and Color dropdown filters only.
    return [];
  }
  if(modId==="elastic"){
    // Elastic uses clean Color and Width dropdown filters only.
    return [];
  }
  if(modId==="thread"){
    // Thread uses clean Type, Color, and Status dropdown filters only.
    return [];
  }
  if(modId==="heels"){
    // Heel uses clean dropdown filters only.
    return [];
  }
  if(modId==="sole_sheets"){
    // Sole Sheets uses clean dropdown filters only.
    return [];
  }
  if(modId==="sooti"){
    // Sooti / Welt uses clean dropdown filters only.
    return [];
  }
  if(modId==="leather_board"){
    // Leather Board uses clean dropdown filters only.
    return [];
  }
  if(modId==="mek"){
    // MEK Sheet uses clean dropdown filters only.
    return [];
  }
  if(modId==="finishing"){
    // Dye Color uses clean dropdown filters only.
    return [];
  }
  if(modId==="polish"){
    // Shoe Polish uses clean dropdown filters only.
    return [];
  }
  if(modId==="expenses"){
    // Petty Cash Ledger uses clean dropdown filter only.
    return [];
  }
  if(modId==="income"){
    // Income / Sales uses clean dropdown filters only.
    return [];
  }
  if(modId==="rules"){
    // Rule Book uses clean dropdown filters only.
    return [];
  }
  if(modId==="heel_tops"){
    // Heel Top / Tapi uses clean dropdown filters only.
    return [];
  }

  if(modId==="putha"){
    // Putha has no quick filters. Search only.
    return [];
  }




  if(modId==="knowledge"){
    // Knowledge Base uses one clean category dropdown, not quick chips.
    return [];
  }
  if(modId==="inspiration"){
    const make=(field,prefix)=>Object.entries(countBySplit(rows,field))
      .sort((a,b)=>b[1]-a[1])
      .slice(0,10)
      .filter(([val])=>!isNoisyQuickValue(val))
      .map(([val,count])=>({id:`${field}:${val}`,label:`${prefix}: ${val}`,count,match:r=>hasSplitValue(r,field,val)}));
    return[
      {id:"all",label:"All References",count:rows.length,match:()=>true},
      ...make("type_of_inspiration","Type"),
      ...make("design_type","Design"),
      ...make("tags","Tag"),
      {id:"with-images",label:"With Images",count:rows.filter(r=>present(r.image_url)).length,match:r=>present(r.image_url)},
      {id:"missing-image",label:"Missing Image",count:rows.filter(r=>!present(r.image_url)).length,match:r=>!present(r.image_url)},
    ];
  }

  if(modId==="patterns"){
    // Laser Patterns uses clean RAG dropdown filters only.
    return [];
  }
  if(modId==="faults"){
    const norm=v=>String(v||"").toLowerCase().trim();
    return[
      {id:"all",label:"All Faults",count:rows.length,match:()=>true},
      {id:"open",label:"Open",count:rows.filter(r=>norm(r.fault_status).includes("open")||!present(r.fault_status)).length,match:r=>norm(r.fault_status).includes("open")||!present(r.fault_status)},
      {id:"critical",label:"Critical",count:rows.filter(r=>boolYes(r.is_critical)).length,match:r=>boolYes(r.is_critical)},
      {id:"upper",label:"Upper",count:rows.filter(r=>norm(r.fault_area)==="upper").length,match:r=>norm(r.fault_area)==="upper"},
      {id:"bottom",label:"Bottom",count:rows.filter(r=>norm(r.fault_area)==="bottom").length,match:r=>norm(r.fault_area)==="bottom"},
      {id:"finish",label:"Finish",count:rows.filter(r=>norm(r.fault_area)==="finish").length,match:r=>norm(r.fault_area)==="finish"},
      {id:"resolved",label:"Resolved / Closed",count:rows.filter(r=>["resolved","closed"].includes(norm(r.fault_status))).length,match:r=>["resolved","closed"].includes(norm(r.fault_status))},
    ];
  }
  if(["laser_sole","rubber_laser"].includes(modId)){
    const normalizeSize=v=>String(v||"").trim();
    const normalizeFarma=v=>String(v||"").trim();
    const countSize=size=>rows.filter(r=>normalizeSize(r.size)===String(size)).length;
    const countFarma=farma=>rows.filter(r=>normalizeFarma(r.farma_id||r.farma_option)===String(farma)).length;
    const allSizes=SHOE_SIZES.filter(s=>/^\d+(?:\.5)?$/.test(String(s)));
    const farmaValues=Array.from(new Set(rows.map(r=>normalizeFarma(r.farma_id||r.farma_option)).filter(Boolean)))
      .sort((a,b)=>Number(a)-Number(b)||String(a).localeCompare(String(b)));
    return[
      {id:"all",label:"All Sizes / Farma",count:rows.length,match:()=>true},
      ...allSizes.map(size=>({
        id:`size:${size}`,
        label:`Size ${size}`,
        count:countSize(size),
        match:r=>normalizeSize(r.size)===String(size)
      })),
      {id:"missing-size",label:"Missing Size",count:rows.filter(r=>!present(r.size)).length,match:r=>!present(r.size)},
      ...farmaValues.map(farma=>({
        id:`farma:${farma}`,
        label:`Farma ${farma}`,
        count:countFarma(farma),
        match:r=>normalizeFarma(r.farma_id||r.farma_option)===String(farma)
      })),
    ].filter(chip=>chip.id==="all"||chip.count>0||chip.id.startsWith("size:"));
  }
  if(["putha","mek"].includes(modId)){
    // Putha and MEK Sheet do not need quick filter chips.
    return [];
  }
  if(modId==="extra_saman"){
    const norm=v=>String(v||"").toLowerCase().trim();
    const pinned=["Shoe Making","Electric","Hardware","Wood"];
    const chips=[
      {id:"all",label:"All",count:rows.length,match:()=>true},
      ...pinned.map(v=>({id:`material-${v}`,label:v,count:rows.filter(r=>norm(r.material_type)===norm(v)).length,match:r=>norm(r.material_type)===norm(v)})),
      {id:"with-video",label:"With Video",count:rows.filter(r=>present(r.video_url)).length,match:r=>present(r.video_url)},
      {id:"missing-material",label:"Missing Material",count:rows.filter(r=>!present(r.material_type)).length,match:r=>!present(r.material_type)},
    ];
    return chips;
  }
  if(modId==="heel_tops"){
    const normType=v=>{const s=String(v||"").toLowerCase();if(s.includes("moti"))return "Moti";if(s.includes("patli")||s.includes("patlee"))return "Patli";if(s.includes("laser"))return "With Laser";if(s.includes("plain"))return "Plain without Laser";return String(v||"").trim();};
    return[
      {id:"all",label:"All Types",count:rows.length,match:()=>true},
      // Always show the main Heel Top/Tapi options, even if a count is 0, so the dropdown is not empty.
      ...HEEL_TOP_TYPES.map(t=>({id:`heel-top-type:${t}`,label:t,count:rows.filter(r=>normType(r.type)===t).length,match:r=>normType(r.type)===t})),
    ];
  }
  if(modId==="videos"){
    const norm=v=>String(v||"").toLowerCase().trim();
    const linked=r=>present(r.upper_id)||present(r.related_pair_id)||present(r.work_order_id)||present(r.customer_id);
    const types=["Upper Making","Bottom Making","Full Pair","Finishing"];
    return[
      {id:"all",label:"All Videos",count:rows.length,match:()=>true},
      ...types.map(v=>({id:`type-${v}`,label:v,count:rows.filter(r=>norm(r.video_type)===norm(v)).length,match:r=>norm(r.video_type)===norm(v)})),
      {id:"published",label:"Published",count:rows.filter(r=>r.status==="Published").length,match:r=>r.status==="Published"},
      {id:"missing-link",label:"Missing Link",count:rows.filter(r=>!linked(r)).length,match:r=>!linked(r)},
    ];
  }
  if(modId==="uppers"){
    // Upper uses the dedicated dropdown filters only: Style, Size, Farma.
    // Do not show old quick chips such as Ready, Sold, Loafer, Bantu, etc.
    return [];
  }

  // Priority filter fields - scanned directly from data keys, not just display cols
  const PRIORITY=["finish_status","status","type","style","country","source","use_for",
    "lace_type","welt_type","payment_type","fault_status","fault_area","priority",
    "current_condition","video_type","expense_category","stock_or_order","unit",
    "tool_type","knowledge_category","pattern_type","delivery_status","with_sooti",
    "sole_type","upper_new_or_old","type_of_inspiration","available","is_done",
    "fault_type","rule_category","is_active","color","vendor","company"];
  
  const dataKeys=new Set(rows.flatMap(r=>Object.keys(r)));
  const candidates=PRIORITY.filter(k=>dataKeys.has(k));
  
  if(candidates.length<2){
    const sampleRow=rows[0];
    Object.keys(sampleRow).forEach(k=>{
      if(["id","airtable_id","image_url","video_url","receipt_url","notes","description","address","created_at","updated_at"].includes(k))return;
      if(k.toLowerCase().includes("date")||k.toLowerCase().includes("time"))return;
      if(candidates.includes(k))return;
      const uniq=new Set(rows.map(r=>r[k]).filter(v=>v!=null&&v!==""));
      if(uniq.size>=2&&uniq.size<=12)candidates.push(k);
    });
  }

  const chips=[];
  for(const key of candidates.slice(0,3)){
    const counts={};
    rows.forEach(r=>{const v=r[key];
      if(v==null||v===""||v===false||v==="false")return;
      const label=v===true||v==="true"?"Yes":String(v);
      if(isNoisyQuickValue(label))return;
      counts[label]=(counts[label]||0)+1;
    });
    const entries=Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,5);
    if(entries.length<2)continue;
    const colLabel=cols.find(c=>c.k===key)?.l||key.replace(/_/g," ");
    entries.forEach(([val,count])=>{
      chips.push({id:`${key}:${val}`,col:key,val:val==="Yes"?"true":val,label:val,displayVal:val,count,colLabel,match:r=>String(r[key]??"")==(val==="Yes"?"true":val)});
    });
    if(chips.length>=9)break;
  }
  return chips;
}

// ── Trend Indicator — relative position within dataset ────────
function getTrend(row,allRows,cols,modId){
  if(modId==="knowledge"){
    if(!present(row.knowledge_category))return{icon:"⚠",label:"Missing Category",c:"#DC2626"};
    if(!present(row.point_info))return{icon:"⚠",label:"Missing Info",c:"#DC2626"};
    const d=daysOld(row.date_added||row.created_at||row.updated_at);
    if(d!==null&&d<30)return{icon:"🆕",label:"New",c:"#1D4ED8"};
    return{icon:"→",label:"Normal",c:C.dim};
  }
  if(modId==="putha"){
    // Putha / Sole Leather does not need quick filter chips.
    return [];
  }
  if(modId==="extra_saman"){
    const q=Number(row.quantity);
    const d=daysOld(row.date_added||row.created_at||row.updated_at);
    if(!present(row.material_type))return{icon:"⚠",label:"Missing Material",c:"#DC2626"};
    if(!isNaN(q)&&q>0&&q<=1)return{icon:"↓",label:"Low Qty",c:"#DC2626"};
    if(present(row.video_url))return{icon:"▶",label:"Has Video",c:"#15803D"};
    if(d!==null&&d<30)return{icon:"🆕",label:"New",c:"#1D4ED8"};
    return{icon:"→",label:"Normal",c:C.dim};
  }
  if(modId==="videos"){
    const linked=present(row.upper_id)||present(row.related_pair_id)||present(row.work_order_id)||present(row.customer_id);
    const d=daysOld(row.upload_date||row.date_added||row.created_at||row.updated_at);
    if(!linked)return{icon:"⚠",label:"Missing Link",c:"#DC2626"};
    if(row.status==="Published")return{icon:"✓",label:"Published",c:"#15803D"};
    if(row.status==="Draft")return{icon:"○",label:"Draft",c:"#D97706"};
    if(present(row.video_url))return{icon:"▶",label:"Has Video",c:"#15803D"};
    if(d!==null&&d<30)return{icon:"🆕",label:"New",c:"#1D4ED8"};
    return{icon:"→",label:"Normal",c:C.dim};
  }
  // 1. Quantity-based trend (relative to column average)
  const numKeys=["quantity","quantity_left","stock_count","available_quantity",
    "unit_quantity","pieces_count","quantity_in_pairs","quantity_inches","quantity_sheets"];
  for(const k of numKeys){
    const v=Number(row[k]);
    if(isNaN(v)||v===0||row[k]==null)continue;
    const vals=allRows.map(r=>Number(r[k])).filter(n=>!isNaN(n)&&n>0);
    if(vals.length<3)continue;
    const avg=vals.reduce((s,n)=>s+n,0)/vals.length;
    if(v<avg*0.25)return{icon:"⚠",label:"Very low",c:"#9B1C1C"};
    if(v<avg*0.5)return{icon:"↓",label:"Low",c:"#DC2626"};
    if(v>avg*2)return{icon:"↑",label:"High",c:"#15803D"};
    return{icon:"→",label:"Normal",c:C.dim};
  }
  // 2. Date-based: New if added within 60 days
  const dateKeys=["date_added","date_made","procurement_date","production_date","purchase_date","date_received"];
  for(const k of dateKeys){
    if(!row[k])continue;
    const d=new Date(row[k]);if(isNaN(d.getTime()))continue;
    const days=(Date.now()-d.getTime())/(1000*60*60*24);
    if(days<30)return{icon:"🆕",label:"New",c:"#1D4ED8"};
    if(days<90)return{icon:"🔁",label:"Recent",c:"#1D4ED8"};
  }
  // 3. Status-based spike detection
  if(row.is_critical===true||row.is_critical==="true")return{icon:"⚠",label:"Critical",c:"#9B1C1C"};
  if(row.finish_status==="Unfinish"||row.status==="Under Repair")return{icon:"↓",label:"Action needed",c:"#D97706"};
  return null;
}

function getFilterColumns(modId,cols,rows){
  if(modId==="knowledge"){
    return[
      {k:"knowledge_category",l:"Knowledge Category",t:"badge"},
    ];
  }
  if(modId==="putha"){
    // Putha / Sole Leather does not need quick filter chips.
    return [];
  }
  if(modId==="extra_saman"){
    return[
      {k:"material_type",l:"Material Type",t:"badge"},
    ];
  }
  if(modId==="videos"){
    return[
      {k:"video_type",l:"Video Type",t:"badge"},
    ];
  }
  return cols;
}
function getFilterOptions(modId,colKey,rows){
  if(modId==="knowledge"&&colKey==="knowledge_category"){
    const vals=[...new Set([...KNOWLEDGE_CATEGORIES,...rows.map(r=>r.knowledge_category).filter(present).map(String)])];
    return vals.filter(Boolean).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
  }
  if(modId==="putha"){
    // Putha / Sole Leather does not need quick filter chips.
    return [];
  }
  if(modId==="extra_saman"){
    if(colKey==="material_type")return EXTRA_MATERIAL_TYPES;
  }
  if(modId==="videos"&&colKey==="video_type"){
    const vals=[...new Set([...MARKETING_VIDEO_TYPES,...rows.map(r=>r.video_type).filter(present).map(String)])];
    return vals.filter(Boolean).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
  }
  const vals=[...new Set(rows.map(r=>getVirtualValue(r,colKey)).filter(v=>present(v)).map(String))];
  return vals.length>0&&vals.length<=30?vals.sort((a,b)=>a.localeCompare(b,undefined,{numeric:true})):[];
}

// ── Filter Panel Component ───────────────────────────────────
const CONDITIONS_BY_TYPE={
  img:[],
  id:["equals",">","<","is empty","is not empty"],
  num:["equals",">","<","is empty","is not empty"],
  date:["equals","before","after","is empty","is not empty"],
  money:["equals",">","<","is empty","is not empty"],
  bool:["equals","is empty","is not empty"],
  badge:["equals","contains","is empty","is not empty"],
  status_done:["equals","is empty"],
  default:["contains","equals","starts with","ends with","is empty","is not empty"],
};

function FilterPanel({cols,filterRules,setFilterRules,onClose,rows=[],modId}){
  const textCols=cols.filter(c=>c.t!=="img");
  const add=()=>setFilterRules(r=>[...r,{col:textCols[0]?.k||"",cond:modId==="extra_saman"?"equals":"contains",val:""}]);
  const upd=(i,changes)=>setFilterRules(r=>r.map((x,j)=>j===i?{...x,...changes}:x));
  const rem=i=>setFilterRules(r=>r.filter((_,j)=>j!==i));
  const getConditions=colKey=>{const col=cols.find(c=>c.k===colKey);return CONDITIONS_BY_TYPE[col?.t||"default"]||CONDITIONS_BY_TYPE.default;};
  const needsValue=cond=>!["is empty","is not empty"].includes(cond);

  if(modId==="knowledge"){
    const current=filterRules.find(r=>r.col==="knowledge_category")?.val||"";
    const missingActive=filterRules.some(r=>r.col==="knowledge_category"&&r.cond==="is empty");
    const setCategory=v=>{
      if(!v)setFilterRules([]);
      else if(v==="__missing__")setFilterRules([{col:"knowledge_category",cond:"is empty",val:""}]);
      else setFilterRules([{col:"knowledge_category",cond:"equals",val:v}]);
    };
    const options=getFilterOptions("knowledge","knowledge_category",rows);
    return <div style={{background:"#FFFFFF",border:"none",borderBottom:`2px solid ${C.accent}`,boxShadow:"0 2px 8px rgba(0,0,0,0.08)",padding:"16px 18px",flexShrink:0,position:"relative"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <i className="ti ti-filter" style={{fontSize:14,color:C.accent}}/>
          <span style={{color:C.text,fontSize:13,fontWeight:700}}>Filter by Knowledge Category</span>
          <span style={{color:C.sub,fontSize:12}}>— simple category filter</span>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>setFilterRules([])} style={{background:"none",border:`1px solid ${C.border}`,color:C.sub,borderRadius:0,padding:"4px 12px",cursor:"pointer",fontSize:12}}>Clear</button>
          <button onClick={onClose} style={{background:"none",border:`1px solid ${C.border}`,color:C.dim,borderRadius:0,padding:"4px 10px",cursor:"pointer",fontSize:12}}><i className="ti ti-x" style={{fontSize:13}}/></button>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"minmax(240px,420px) 1fr",gap:12,alignItems:"end"}}>
        <div>
          <label style={{display:"block",color:C.sub,fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:5}}>Knowledge Category</label>
          <select value={missingActive?"__missing__":current} onChange={e=>setCategory(e.target.value)} style={{...C.inp,padding:"10px 12px",fontSize:13,appearance:"none",cursor:"pointer",background:C.card}}>
            <option value="">All categories</option>
            {options.map(o=><option key={o} value={o}>{o}</option>)}
            <option value="__missing__">Missing Category</option>
          </select>
        </div>
        <p style={{margin:0,color:C.sub,fontSize:12,lineHeight:1.5}}>Choose one knowledge category. This is the only Knowledge Base filter.</p>
      </div>
    </div>;
  }

  if(modId==="videos"){
    const current=filterRules.find(r=>r.col==="video_type")?.val||"";
    const setType=v=>{
      if(!v)setFilterRules([]);
      else setFilterRules([{col:"video_type",cond:"equals",val:v}]);
    };
    const options=getFilterOptions("videos","video_type",rows);
    return <div style={{background:"#FFFFFF",border:"none",borderBottom:`2px solid ${C.accent}`,boxShadow:"0 2px 8px rgba(0,0,0,0.08)",padding:"16px 18px",flexShrink:0,position:"relative"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <i className="ti ti-filter" style={{fontSize:14,color:C.accent}}/>
          <span style={{color:C.text,fontSize:13,fontWeight:700}}>Filter by Video Type</span>
          <span style={{color:C.sub,fontSize:12}}>— one simple filter for Marketing Videos</span>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>setFilterRules([])} style={{background:"none",border:`1px solid ${C.border}`,color:C.sub,borderRadius:0,padding:"4px 12px",cursor:"pointer",fontSize:12}}>Clear</button>
          <button onClick={onClose} style={{background:"none",border:`1px solid ${C.border}`,color:C.dim,borderRadius:0,padding:"4px 10px",cursor:"pointer",fontSize:12}}><i className="ti ti-x" style={{fontSize:13}}/></button>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"minmax(240px,420px) 1fr",gap:12,alignItems:"end"}}>
        <div>
          <label style={{display:"block",color:C.sub,fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:5}}>Video Type</label>
          <select value={current} onChange={e=>setType(e.target.value)} style={{...C.inp,padding:"10px 12px",fontSize:13,appearance:"none",cursor:"pointer",background:C.card}}>
            <option value="">All video types</option>
            {options.map(o=><option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <p style={{margin:0,color:C.sub,fontSize:12,lineHeight:1.5}}>Choose one type: Upper Making, Bottom Making, Full Pair, Finishing, or Marketing. Related links are handled in the Add/Edit form.</p>
      </div>
    </div>;
  }

  if(modId==="putha"){
    // Putha / Sole Leather does not need quick filter chips.
    return [];
  }
  if(modId==="extra_saman"){
    const current=filterRules.find(r=>r.col==="material_type")?.val||"";
    const missingActive=filterRules.some(r=>r.col==="material_type"&&r.cond==="is empty");
    const setMaterial=v=>{
      if(!v)setFilterRules([]);
      else if(v==="__missing__")setFilterRules([{col:"material_type",cond:"is empty",val:""}]);
      else setFilterRules([{col:"material_type",cond:"equals",val:v}]);
    };
    return <div style={{background:"#FFFFFF",border:"none",borderBottom:`2px solid ${C.accent}`,boxShadow:"0 2px 8px rgba(0,0,0,0.08)",padding:"16px 18px",flexShrink:0,position:"relative"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <i className="ti ti-filter" style={{fontSize:14,color:C.accent}}/>
          <span style={{color:C.text,fontSize:13,fontWeight:700}}>Filter by Material Type</span>
          <span style={{color:C.sub,fontSize:12}}>— one simple filter for Extra Saman</span>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>setFilterRules([])} style={{background:"none",border:`1px solid ${C.border}`,color:C.sub,borderRadius:0,padding:"4px 12px",cursor:"pointer",fontSize:12}}>Clear</button>
          <button onClick={onClose} style={{background:"none",border:`1px solid ${C.border}`,color:C.dim,borderRadius:0,padding:"4px 10px",cursor:"pointer",fontSize:12}}><i className="ti ti-x" style={{fontSize:13}}/></button>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"minmax(240px,420px) 1fr",gap:12,alignItems:"end"}}>
        <div>
          <label style={{display:"block",color:C.sub,fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:5}}>Material Type</label>
          <select value={missingActive?"__missing__":current} onChange={e=>setMaterial(e.target.value)} style={{...C.inp,padding:"10px 12px",fontSize:13,appearance:"none",cursor:"pointer",background:C.card}}>
            <option value="">All material types</option>
            {EXTRA_MATERIAL_TYPES.map(o=><option key={o} value={o}>{o}</option>)}
            <option value="__missing__">Missing Material</option>
          </select>
        </div>
        <p style={{margin:0,color:C.sub,fontSize:12,lineHeight:1.5}}>Choose one material type. This works after records have a Material Type saved. Right now blank rows are counted under Missing Material.</p>
      </div>
    </div>;
  }

  return <div style={{background:"#FFFFFF",border:"none",borderBottom:`2px solid ${C.accent}`,boxShadow:"0 2px 8px rgba(0,0,0,0.08)",padding:"16px 18px",flexShrink:0,position:"relative"}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <i className="ti ti-filter" style={{fontSize:14,color:C.accent}}/>
        <span style={{color:C.text,fontSize:13,fontWeight:600}}>Filter Records</span>
        {filterRules.length>0&&<span style={{color:C.sub,fontSize:12}}>— {filterRules.length} rule{filterRules.length!==1?"s":""}</span>}
      </div>
      <div style={{display:"flex",gap:8}}>
        {filterRules.length>0&&<button onClick={()=>setFilterRules([])} style={{background:"none",border:`1px solid ${C.border}`,color:C.sub,borderRadius:0,padding:"4px 12px",cursor:"pointer",fontSize:12}}>Clear all</button>}
        <button onClick={onClose} style={{background:"none",border:`1px solid ${C.border}`,color:C.dim,borderRadius:0,padding:"4px 10px",cursor:"pointer",fontSize:12}}><i className="ti ti-x" style={{fontSize:13}}/></button>
      </div>
    </div>

    <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:12}}>
      {filterRules.map((rule,i)=>{
        const conditions=getConditions(rule.col);
        const colType=cols.find(c=>c.k===rule.col)?.t||"text";
        return <div key={i} style={{background:"#F8F8F6",border:`1px solid ${C.border}`,borderRadius:0,padding:"14px 16px",position:"relative"}}>
          {/* Row label */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
            <span style={{background:i===0?"#F3F3F1":C.accentD,color:i===0?C.sub:C.accent,fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",padding:"2px 8px",borderRadius:0,border:`1px solid ${i===0?C.border:C.accent}`}}>{i===0?"Where":"And"}</span>
            <button onClick={()=>rem(i)} style={{background:"none",border:`1px solid ${C.border}`,color:"#E05040",borderRadius:0,padding:"4px 8px",cursor:"pointer",fontSize:11,display:"flex",alignItems:"center",gap:4}}>
              <i className="ti ti-trash" style={{fontSize:12}}/> Remove
            </button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
            {/* Step 1: Column */}
            <div>
              <label style={{display:"block",color:C.sub,fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:5}}>① Column</label>
              <select value={rule.col} onChange={e=>upd(i,{col:e.target.value,cond:modId==="extra_saman"?"equals":"contains",val:""})}
                style={{...C.inp,padding:"8px 10px",fontSize:12,appearance:"none",cursor:"pointer"}}>
                {textCols.map(c=><option key={c.k} value={c.k}>{c.l}</option>)}
              </select>
            </div>
            {/* Step 2: Condition */}
            <div>
              <label style={{display:"block",color:C.sub,fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:5}}>② Condition</label>
              <select value={rule.cond} onChange={e=>upd(i,{cond:e.target.value})}
                style={{...C.inp,padding:"8px 10px",fontSize:12,appearance:"none",cursor:"pointer"}}>
                {conditions.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            {/* Step 3: Value */}
            <div>
              <label style={{display:"block",color:C.sub,fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:5}}>③ Value</label>
              {needsValue(rule.cond)?(
                colType==="date"?
                <input type="date" value={rule.val||""} onChange={e=>upd(i,{val:e.target.value})} style={{...C.inp,padding:"8px 10px",fontSize:12}}/>
                :colType==="num"||colType==="money"||colType==="id"?
                <input type="number" value={rule.val||""} onChange={e=>upd(i,{val:e.target.value})} placeholder="e.g. 100" style={{...C.inp,padding:"8px 10px",fontSize:12}}/>
                :(()=>{const opts=getFilterOptions(modId,rule.col,rows);return opts.length?
                <select value={rule.val||""} onChange={e=>upd(i,{val:e.target.value})} style={{...C.inp,padding:"8px 10px",fontSize:12,appearance:"none",cursor:"pointer"}}>
                  <option value="">— Select value —</option>{opts.map(o=><option key={o} value={o}>{o}</option>)}
                </select>
                :<input type="text" value={rule.val||""} onChange={e=>upd(i,{val:e.target.value})} placeholder={`e.g. Oxford`} autoFocus={i===filterRules.length-1&&!rule.val} style={{...C.inp,padding:"8px 10px",fontSize:12}}/>;})()
              ):<div style={{...C.inp,padding:"8px 10px",fontSize:12,color:C.dim,background:"transparent",border:`1px solid ${C.border}`}}>— not needed —</div>}
            </div>
          </div>
        </div>;
      })}
    </div>

    <button onClick={add} style={{display:"flex",alignItems:"center",gap:6,background:C.accentD,border:`1px solid ${C.accent}`,color:C.accent,borderRadius:0,padding:"8px 18px",cursor:"pointer",fontSize:13,fontWeight:600}}>
      <i className="ti ti-plus" style={{fontSize:14}}/> + Add another filter
    </button>
  </div>;
}

// ── Enterprise Data Table — Smart Filtering + Trends ─────────
const DENSITY_CFG={compact:{rh:32,pad:"4px 10px",fs:12},cozy:{rh:44,pad:"8px 12px",fs:13.5},comfortable:{rh:56,pad:"12px 14px",fs:14}};

function Highlight({text,q}){
  if(!q||text==null)return <>{String(text??"—")}</>;
  const s=String(text);const idx=s.toLowerCase().indexOf(q.toLowerCase());
  if(idx===-1)return <>{s}</>;
  return <>{s.slice(0,idx)}<mark style={{background:"rgba(240,180,41,0.28)",color:"#7C3D00",borderRadius:0,padding:"0 2px"}}>{s.slice(idx,idx+q.length)}</mark>{s.slice(idx+q.length)}</>;
}

function DataTable({modId,rows,onAdd,onEdit,onDelete,loading,tok}){
  const allCols=COLS[modId]||[];
  const[q,setQ]=useState("");
  const[sortK,setSortK]=useState(null);
  const[sortD,setSortD]=useState("asc");
  const[selected,setSelected]=useState(new Set());
  const[density,setDensity]=useState("cozy");
  const[viewMode,setViewMode]=useState("table"); // table is always default; card/tile is optional
  const[hidden,setHidden]=useState(new Set());
  const[colMenu,setColMenu]=useState(false);
  const[filterRules,setFilterRules]=useState([]);
  const[filterOpen,setFilterOpen]=useState(false);
  const[activeChip,setActiveChip]=useState(null); // {col,val}
  const[activeSizeFilter,setActiveSizeFilter]=useState("");
  const[activeFarmaFilter,setActiveFarmaFilter]=useState("");
  const[activeSoleThicknessFilter,setActiveSoleThicknessFilter]=useState("");
  const[activeSoleTypeFilter,setActiveSoleTypeFilter]=useState("");
  const[activeCustomerCountryFilter,setActiveCustomerCountryFilter]=useState("");
  const[activeCustomerStatusFilter,setActiveCustomerStatusFilter]=useState("");
  const[activeCustomerSizeModeFilter,setActiveCustomerSizeModeFilter]=useState("");
  const[activeMeasurementSizeModeFilter,setActiveMeasurementSizeModeFilter]=useState("");
  const[activeWorkOrderTypeFilter,setActiveWorkOrderTypeFilter]=useState("");
  const[activeWorkOrderStatusFilter,setActiveWorkOrderStatusFilter]=useState("");
  const[activeInventoryFinishFilter,setActiveInventoryFinishFilter]=useState("");
  const[activeInventoryStockFilter,setActiveInventoryStockFilter]=useState("");
  const[activeUpperStyleFilter,setActiveUpperStyleFilter]=useState("");
  const[activeUpperSizeFilter,setActiveUpperSizeFilter]=useState("");
  const[activeUpperFarmaFilter,setActiveUpperFarmaFilter]=useState("");
  const[activeUpperLeatherTypeFilter,setActiveUpperLeatherTypeFilter]=useState("");
  const[activeUpperLeatherColorFilter,setActiveUpperLeatherColorFilter]=useState("");
  const[activeFarmaCodeFilter,setActiveFarmaCodeFilter]=useState("");
  const[activeLiningColorFilter,setActiveLiningColorFilter]=useState("");
  const[activeBuckleColorFilter,setActiveBuckleColorFilter]=useState("");
  const[activeLaceTypeFilter,setActiveLaceTypeFilter]=useState("");
  const[activeLaceColorFilter,setActiveLaceColorFilter]=useState("");
  const[activeElasticColorFilter,setActiveElasticColorFilter]=useState("");
  const[activeElasticWidthFilter,setActiveElasticWidthFilter]=useState("");
  const[activeThreadTypeFilter,setActiveThreadTypeFilter]=useState("");
  const[activeThreadColorFilter,setActiveThreadColorFilter]=useState("");
  const[activeThreadStatusFilter,setActiveThreadStatusFilter]=useState("");
  const[activeHeelTypeFilter,setActiveHeelTypeFilter]=useState("");
  const[activeHeelThicknessFilter,setActiveHeelThicknessFilter]=useState("");
  const[activeHeelThicknessTypeFilter,setActiveHeelThicknessTypeFilter]=useState("");
  const[activeSoleSheetNameFilter,setActiveSoleSheetNameFilter]=useState("");
  const[activeSoleSheetColorFilter,setActiveSoleSheetColorFilter]=useState("");
  const[activeSoleSheetStatusFilter,setActiveSoleSheetStatusFilter]=useState("");
  const[activeSootiWeltTypeFilter,setActiveSootiWeltTypeFilter]=useState("");
  const[activeSootiColorFilter,setActiveSootiColorFilter]=useState("");
  const[activeSootiStatusFilter,setActiveSootiStatusFilter]=useState("");
  const[activeLeatherBoardNameFilter,setActiveLeatherBoardNameFilter]=useState("");
  const[activeLeatherBoardThicknessFilter,setActiveLeatherBoardThicknessFilter]=useState("");
  const[activeLeatherBoardStatusFilter,setActiveLeatherBoardStatusFilter]=useState("");
  const[activeTapiTypeFilter,setActiveTapiTypeFilter]=useState("");
  const[activeTapiThicknessFilter,setActiveTapiThicknessFilter]=useState("");
  const[activeTapiStatusFilter,setActiveTapiStatusFilter]=useState("");
  const[activeMekThicknessFilter,setActiveMekThicknessFilter]=useState("");
  const[activeMekStatusFilter,setActiveMekStatusFilter]=useState("");
  const[activeDyeColorFilter,setActiveDyeColorFilter]=useState("");
  const[activeDyeStatusFilter,setActiveDyeStatusFilter]=useState("");
  const[activePolishColorFilter,setActivePolishColorFilter]=useState("");
  const[activePolishCompanyFilter,setActivePolishCompanyFilter]=useState("");
  const[activePolishTypeFilter,setActivePolishTypeFilter]=useState("");
  const[activePolishStatusFilter,setActivePolishStatusFilter]=useState("");
  const[activeExpenseCategoryFilter,setActiveExpenseCategoryFilter]=useState("");
  const[activeIncomeUnitTypeFilter,setActiveIncomeUnitTypeFilter]=useState("");
  const[activeIncomePaymentTypeFilter,setActiveIncomePaymentTypeFilter]=useState("");
  const[activeRuleCategoryFilter,setActiveRuleCategoryFilter]=useState("");
  const[activeRuleActiveFilter,setActiveRuleActiveFilter]=useState("");
  const[activeSopCategoryFilter,setActiveSopCategoryFilter]=useState("");
  const[activeInspirationTypeFilter,setActiveInspirationTypeFilter]=useState("");
  const[activeInspirationDesignFilter,setActiveInspirationDesignFilter]=useState("");
  const[activeInspirationStatusFilter,setActiveInspirationStatusFilter]=useState("");
  const[activePatternNameFilter,setActivePatternNameFilter]=useState("");
  const[activePatternStatusFilter,setActivePatternStatusFilter]=useState("");
  const[farmaFilterOptions,setFarmaFilterOptions]=useState([]);
  const[page,setPage]=useState(1);
  const[pageSize,setPageSize]=useState(25);
  const[lb,setLb]=useState(null);
  const[videoLb,setVideoLb]=useState(null);
  const colMenuRef=useRef();const filterRef=useRef();

  useEffect(()=>setPage(1),[q,sortK,filterRules,activeChip,activeSizeFilter,activeFarmaFilter,activeSoleThicknessFilter,activeSoleTypeFilter,activeCustomerCountryFilter,activeCustomerStatusFilter,activeCustomerSizeModeFilter,activeMeasurementSizeModeFilter,activeWorkOrderTypeFilter,activeWorkOrderStatusFilter,activeInventoryFinishFilter,activeInventoryStockFilter,activeUpperStyleFilter,activeUpperSizeFilter,activeUpperFarmaFilter,activeUpperLeatherTypeFilter,activeUpperLeatherColorFilter,activeFarmaCodeFilter,activeLiningColorFilter,activeBuckleColorFilter,activeLaceTypeFilter,activeLaceColorFilter,activeElasticColorFilter,activeElasticWidthFilter,activeThreadTypeFilter,activeThreadColorFilter,activeThreadStatusFilter,activeHeelTypeFilter,activeHeelThicknessFilter,activeHeelThicknessTypeFilter,activeSoleSheetNameFilter,activeSoleSheetColorFilter,activeSoleSheetStatusFilter,activeSootiWeltTypeFilter,activeSootiColorFilter,activeSootiStatusFilter,activeLeatherBoardNameFilter,activeLeatherBoardThicknessFilter,activeLeatherBoardStatusFilter,activeTapiTypeFilter,activeTapiThicknessFilter,activeTapiStatusFilter,activeMekThicknessFilter,activeMekStatusFilter,activeDyeColorFilter,activeDyeStatusFilter,activePolishColorFilter,activePolishCompanyFilter,activePolishTypeFilter,activePolishStatusFilter,activeExpenseCategoryFilter,activeIncomeUnitTypeFilter,activeIncomePaymentTypeFilter,activeRuleCategoryFilter,activeRuleActiveFilter,activeSopCategoryFilter,activeInspirationTypeFilter,activeInspirationDesignFilter,activeInspirationStatusFilter,activePatternNameFilter,activePatternStatusFilter,modId]);
  useEffect(()=>{setSelected(new Set());setSortK(null);setFilterRules([]);
    setHidden(new Set());setViewMode("table");setQ("");setFilterOpen(false);setActiveChip(null);setActiveSizeFilter("");setActiveFarmaFilter("");setActiveSoleThicknessFilter("");setActiveSoleTypeFilter("");setActiveCustomerCountryFilter("");setActiveCustomerStatusFilter("");setActiveCustomerSizeModeFilter("");setActiveMeasurementSizeModeFilter("");setActiveWorkOrderTypeFilter("");setActiveWorkOrderStatusFilter("");setActiveInventoryFinishFilter("");setActiveInventoryStockFilter("");setActiveUpperStyleFilter("");setActiveUpperSizeFilter("");setActiveUpperFarmaFilter("");setActiveUpperLeatherTypeFilter("");setActiveUpperLeatherColorFilter("");setActiveFarmaCodeFilter("");setActiveLiningColorFilter("");setActiveBuckleColorFilter("");setActiveLaceTypeFilter("");setActiveLaceColorFilter("");setActiveElasticColorFilter("");setActiveElasticWidthFilter("");setActiveThreadTypeFilter("");setActiveThreadColorFilter("");setActiveThreadStatusFilter("");setActiveHeelTypeFilter("");setActiveHeelThicknessFilter("");setActiveHeelThicknessTypeFilter("");setActiveSoleSheetNameFilter("");setActiveSoleSheetColorFilter("");setActiveSoleSheetStatusFilter("");setActiveSootiWeltTypeFilter("");setActiveSootiColorFilter("");setActiveSootiStatusFilter("");setActiveLeatherBoardNameFilter("");setActiveLeatherBoardStatusFilter("");setActiveTapiTypeFilter("");setActiveTapiThicknessFilter("");setActiveTapiStatusFilter("");setActiveMekThicknessFilter("");setActiveMekStatusFilter("");setActiveDyeColorFilter("");setActiveDyeStatusFilter("");setActivePolishColorFilter("");setActivePolishCompanyFilter("");setActivePolishTypeFilter("");setActivePolishStatusFilter("");setActiveExpenseCategoryFilter("");setActiveIncomeUnitTypeFilter("");setActiveIncomePaymentTypeFilter("");setActiveRuleCategoryFilter("");setActiveRuleActiveFilter("");setActiveSopCategoryFilter("");setActiveInspirationTypeFilter("");setActiveInspirationDesignFilter("");setActiveInspirationStatusFilter("");setActivePatternNameFilter("");setActivePatternStatusFilter("");},[modId]);
  useEffect(()=>{
    if(!["laser_sole","rubber_laser"].includes(modId))return;
    const headers={"apikey":SB_KEY,...(tok?{"Authorization":`Bearer ${tok}`}:{})};
    fetch(`${SB_URL}/rest/v1/farma?select=id,option_no,size,image_url,notes&order=id.asc`,{headers})
      .then(r=>r.ok?r.json():Promise.reject(r))
      .then(rows=>{
        const opts=(Array.isArray(rows)?rows:[]).map(r=>{
          const value=String(r.option_no||r.id||"").trim();
          const label=[`Farma ${value}`,r.size?`Size ${r.size}`:""].filter(Boolean).join(" — ");
          return value?{value,label,countValue:value}:null;
        }).filter(Boolean);
        setFarmaFilterOptions(opts.length?opts:[1,2,3,4,5,6,7,8].map(n=>({value:String(n),label:`Farma ${n}`,countValue:String(n)})));
      })
      .catch(()=>setFarmaFilterOptions([1,2,3,4,5,6,7,8].map(n=>({value:String(n),label:`Farma ${n}`,countValue:String(n)}))));
  },[modId,tok]);
  useEffect(()=>{
    const h=e=>{
      if(colMenuRef.current&&!colMenuRef.current.contains(e.target))setColMenu(false);
      if(filterRef.current&&!filterRef.current.contains(e.target))setFilterOpen(false);
    };
    document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h);
  },[]);

  const dens=DENSITY_CFG[density];
  const visibleCols=allCols.filter(c=>!hidden.has(c.k));
  const filterCols=getFilterColumns(modId,allCols,rows);
  const activeFilters=filterRules.filter(r=>r.col&&(r.val||["is empty","is not empty"].includes(r.cond)));
  const quickChips=getQuickFilters(modId,allCols,rows);

  // ── Apply chip + advanced filters + search ──
  let filtered=rows.filter(r=>{
    if(["laser_sole","rubber_laser"].includes(modId)){
      const rowSize=String(r.size||"").trim();
      if(activeSizeFilter){
        if(activeSizeFilter==="__missing__"){if(present(r.size))return false;}
        else if(rowSize!==activeSizeFilter)return false;
      }
      if(activeFarmaFilter){
        const farmaOk=String(r.farma_id||"").trim()===String(activeFarmaFilter)||String(r.farma_option||"").trim()===String(activeFarmaFilter);
        if(!farmaOk)return false;
      }
      if(modId==="laser_sole"){
        const rowThickness=String(r.thickness||"").trim().toLowerCase();
        const rowType=String(r.type||"").trim().toLowerCase();
        if(activeSoleThicknessFilter&&rowThickness!==String(activeSoleThicknessFilter).toLowerCase())return false;
        if(activeSoleTypeFilter&&rowType!==String(activeSoleTypeFilter).toLowerCase())return false;
      }
    }else if(modId==="inventory"){
      const finish=String(r.finish_status||"").trim().toLowerCase();
      const stock=String(r.status||"").trim().toLowerCase();
      if(activeInventoryFinishFilter&&finish!==String(activeInventoryFinishFilter).toLowerCase())return false;
      if(activeInventoryStockFilter&&stock!==String(activeInventoryStockFilter).toLowerCase())return false;
    }else if(modId==="work_orders"){
      const woType=String(r.work_order_type||"").trim().toLowerCase();
      const woStatus=String(r.work_order_status||"").trim().toLowerCase();
      if(activeWorkOrderTypeFilter&&woType!==String(activeWorkOrderTypeFilter).toLowerCase())return false;
      if(activeWorkOrderStatusFilter&&woStatus!==String(activeWorkOrderStatusFilter).toLowerCase())return false;
    }else if(modId==="uppers"){
      const style=String(r.style||"").trim().toLowerCase();
      const size=String(r.size||"").trim();
      if(activeUpperStyleFilter&&style!==String(activeUpperStyleFilter).toLowerCase())return false;
      if(activeUpperSizeFilter&&size!==String(activeUpperSizeFilter))return false;
      if(activeUpperFarmaFilter&&!upperRowMatchesFarma(r,activeUpperFarmaFilter))return false;
    }else if(modId==="farma"){
      if(activeFarmaCodeFilter&&!upperRowMatchesFarma(r,activeFarmaCodeFilter))return false;
    }else if(modId==="buckles"){
      if(activeBuckleColorFilter==="__missing__"&&String(r.color||"").trim())return false;
      if(activeBuckleColorFilter&&activeBuckleColorFilter!=="__missing__"&&!buckleColorMatches(r,activeBuckleColorFilter))return false;
    }else if(modId==="laces"){
      const laceType=String(r.lace_type||"").trim().toLowerCase();
      if(activeLaceTypeFilter&&laceType!==String(activeLaceTypeFilter).toLowerCase())return false;
      if(activeLaceColorFilter==="__missing__"&&String(r.color||"").trim())return false;
      if(activeLaceColorFilter&&activeLaceColorFilter!=="__missing__"&&!laceColorMatches(r,activeLaceColorFilter))return false;
    }else if(modId==="elastic"){
      const elasticColor=String(r.color||"").trim();
      const elasticWidth=String(r.width||"").trim();
      if(activeElasticColorFilter==="__missing__"&&elasticColor)return false;
      if(activeElasticColorFilter&&activeElasticColorFilter!=="__missing__"&&elasticColor.toLowerCase()!==String(activeElasticColorFilter).toLowerCase())return false;
      if(activeElasticWidthFilter==="__missing__"&&elasticWidth)return false;
      if(activeElasticWidthFilter&&activeElasticWidthFilter!=="__missing__"&&elasticWidth.toLowerCase()!==String(activeElasticWidthFilter).toLowerCase())return false;
    }else if(modId==="thread"){
      const type=String(r.type||"").trim();
      const color=String(r.color||"").trim();
      const status=String(r.status||"").trim();
      if(activeThreadTypeFilter&&type.toLowerCase()!==String(activeThreadTypeFilter).toLowerCase())return false;
      if(activeThreadColorFilter==="__missing__"&&color)return false;
      if(activeThreadColorFilter&&activeThreadColorFilter!=="__missing__"&&color.toLowerCase()!==String(activeThreadColorFilter).toLowerCase())return false;
      if(activeThreadStatusFilter&&status.toLowerCase()!==String(activeThreadStatusFilter).toLowerCase())return false;
    }else if(modId==="heels"){
      const heelType=String(r.heel_type||"").trim().toLowerCase();
      const thickness=String(r.thickness||"").trim().toLowerCase();
      const thicknessType=String(r.thickness_type||"").trim().toLowerCase();
      if(activeHeelTypeFilter&&heelType!==String(activeHeelTypeFilter).toLowerCase())return false;
      if(activeHeelThicknessFilter&&thickness!==String(activeHeelThicknessFilter).toLowerCase())return false;
      if(activeHeelThicknessTypeFilter&&thicknessType!==String(activeHeelThicknessTypeFilter).toLowerCase())return false;
    }else if(modId==="sooti"){
      const weltType=String(r.welt_type||"").trim().toLowerCase();
      const color=String(r.color||"").trim().toLowerCase();
      const status=String(r.status||"").trim().toLowerCase();
      if(activeSootiWeltTypeFilter&&weltType!==String(activeSootiWeltTypeFilter).toLowerCase())return false;
      if(activeSootiColorFilter&&color!==String(activeSootiColorFilter).toLowerCase())return false;
      if(activeSootiStatusFilter&&status!==String(activeSootiStatusFilter).toLowerCase())return false;
    }else if(modId==="patterns"){
      const pname=String(r.pattern_name||r.pattern_type||"").trim().toLowerCase();
      const status=String(r.laser_pattern_status||"").trim().toLowerCase();
      if(activePatternNameFilter&&pname!==String(activePatternNameFilter).toLowerCase())return false;
      if(activePatternStatusFilter&&status!==String(activePatternStatusFilter).toLowerCase())return false;
    }else if(modId==="inspiration"){
      const type=String(r.type_of_inspiration||"").trim().toLowerCase();
      const design=String(r.design_type||"").trim().toLowerCase();
      const status=String(r.inspiration_status||"").trim().toLowerCase();
      if(activeInspirationTypeFilter&&type!==String(activeInspirationTypeFilter).toLowerCase())return false;
      if(activeInspirationDesignFilter&&design!==String(activeInspirationDesignFilter).toLowerCase())return false;
      if(activeInspirationStatusFilter&&status!==String(activeInspirationStatusFilter).toLowerCase())return false;
    }else if(modId==="sops"){
      const category=String(r.rule_category||"").trim().toLowerCase();
      if(activeSopCategoryFilter&&category!==String(activeSopCategoryFilter).toLowerCase())return false;
    }else if(modId==="rules"){
      const category=String(r.rule_category||"").trim().toLowerCase();
      const activeVal=(r.is_active===true||String(r.is_active).toLowerCase()==="true"||String(r.is_active).toLowerCase()==="yes")?"yes":"no";
      if(activeRuleCategoryFilter&&category!==String(activeRuleCategoryFilter).toLowerCase())return false;
      if(activeRuleActiveFilter&&activeVal!==String(activeRuleActiveFilter).toLowerCase())return false;
    }else if(modId==="income"){
      const unitType=String(r.unit_type||"").trim().toLowerCase();
      const paymentType=String(r.payment_type||"").trim().toLowerCase();
      if(activeIncomeUnitTypeFilter&&unitType!==String(activeIncomeUnitTypeFilter).toLowerCase())return false;
      if(activeIncomePaymentTypeFilter&&paymentType!==String(activeIncomePaymentTypeFilter).toLowerCase())return false;
    }else if(modId==="expenses"){
      const category=String(r.expense_category||"").trim().toLowerCase();
      if(activeExpenseCategoryFilter&&category!==String(activeExpenseCategoryFilter).toLowerCase())return false;
    }else if(modId==="polish"){
      const color=String(r.color||"").trim().toLowerCase();
      const company=String(r.company||"").trim().toLowerCase();
      const type=String(r.type||"").trim().toLowerCase();
      const status=String(r.status||"").trim().toLowerCase();
      if(activePolishColorFilter&&color!==String(activePolishColorFilter).toLowerCase())return false;
      if(activePolishCompanyFilter&&company!==String(activePolishCompanyFilter).toLowerCase())return false;
      if(activePolishTypeFilter&&type!==String(activePolishTypeFilter).toLowerCase())return false;
      if(activePolishStatusFilter&&status!==String(activePolishStatusFilter).toLowerCase())return false;
    }else if(modId==="finishing"){
      const color=String(r.color||"").trim().toLowerCase();
      const status=String(r.status||"").trim().toLowerCase();
      if(activeDyeColorFilter&&color!==String(activeDyeColorFilter).toLowerCase())return false;
      if(activeDyeStatusFilter&&status!==String(activeDyeStatusFilter).toLowerCase())return false;
    }else if(modId==="mek"){
      const thickness=String(r.thickness||"").trim().toLowerCase();
      const status=String(r.status||"").trim().toLowerCase();
      if(activeMekThicknessFilter&&thickness!==String(activeMekThicknessFilter).toLowerCase())return false;
      if(activeMekStatusFilter&&status!==String(activeMekStatusFilter).toLowerCase())return false;
    }else if(modId==="leather_board"){
      const name=String(r.name_type||"").trim().toLowerCase();
      const status=String(r.status||"").trim().toLowerCase();
      if(activeLeatherBoardNameFilter&&name!==String(activeLeatherBoardNameFilter).toLowerCase())return false;
      if(activeLeatherBoardStatusFilter&&status!==String(activeLeatherBoardStatusFilter).toLowerCase())return false;
    }else if(modId==="heel_tops"){
      const type=String(r.type||"").trim().toLowerCase();
      const thickness=String(r.thickness_mm||"").trim().toLowerCase();
      const status=String(r.status||"").trim().toLowerCase();
      if(activeTapiTypeFilter&&type!==String(activeTapiTypeFilter).toLowerCase())return false;
      if(activeTapiThicknessFilter&&thickness!==String(activeTapiThicknessFilter).toLowerCase())return false;
      if(activeTapiStatusFilter&&status!==String(activeTapiStatusFilter).toLowerCase())return false;
    }else if(modId==="sole_sheets"){
      const name=String(r.name||"").trim().toLowerCase();
      const color=String(r.color||"").trim().toLowerCase();
      const status=String(r.status||"").trim().toLowerCase();
      if(activeSoleSheetNameFilter&&name!==String(activeSoleSheetNameFilter).toLowerCase())return false;
      if(activeSoleSheetColorFilter&&color!==String(activeSoleSheetColorFilter).toLowerCase())return false;
      if(activeSoleSheetStatusFilter&&status!==String(activeSoleSheetStatusFilter).toLowerCase())return false;
    }else if(modId==="lining_leather"){
      if(activeLiningColorFilter==="__missing__"&&inferLeatherColor(r))return false;
      if(activeLiningColorFilter&&activeLiningColorFilter!=="__missing__"&&!leatherColorMatches(r,activeLiningColorFilter))return false;
    }else if(modId==="upper_leather"){
      const patternVals=String(r.type_pattern||"").toLowerCase().split(",").map(s=>s.trim()).filter(Boolean);
      if(activeUpperLeatherTypeFilter&&!patternVals.includes(String(activeUpperLeatherTypeFilter).toLowerCase()))return false;
      if(activeUpperLeatherColorFilter==="__missing__"&&inferLeatherColor(r))return false;
      if(activeUpperLeatherColorFilter&&activeUpperLeatherColorFilter!=="__missing__"&&!leatherColorMatches(r,activeUpperLeatherColorFilter))return false;
    }else if(modId==="customers"){
      const country=String(r.country||"").trim().toLowerCase();
      const status=String(r.delivery_status||"").trim().toLowerCase();
      const sizeMode=String(r.customer_size_mode||r.customer_size_type||(String(r.size||"").toLowerCase().includes("measurement")?"Provided Measurement":present(r.size)?"Generic Size":"")).trim().toLowerCase();
      if(activeCustomerCountryFilter==="pakistan"&&country!=="pakistan")return false;
      if(activeCustomerCountryFilter==="rest"&&country==="pakistan")return false;
      if(activeCustomerStatusFilter&&status!==String(activeCustomerStatusFilter).toLowerCase())return false;
      if(activeCustomerSizeModeFilter&&sizeMode!==String(activeCustomerSizeModeFilter).toLowerCase())return false;
    }else if(modId==="measurements"){
      const hasPoints=[r.point_a,r.point_b,r.point_c,r.point_d,r.point_e,r.point_f].some(present);
      const sizeMode=String(r.customer_size_mode||r.customer_size_type||(hasPoints||String(r.size||"").toLowerCase().includes("measurement")?"Provided Measurement":present(r.size)?"Generic Size":"")).trim().toLowerCase();
      if(activeMeasurementSizeModeFilter&&sizeMode!==String(activeMeasurementSizeModeFilter).toLowerCase())return false;
    }else if(activeChip){
      if(activeChip.match){if(!activeChip.match(r))return false;}
      else if(String(getVirtualValue(r,activeChip.col)??"")!==activeChip.val)return false;
    }
    if(q&&!Object.values(r).some(v=>String(v||"").toLowerCase().includes(q.toLowerCase())))return false;
    for(const f of activeFilters){
      const raw=getVirtualValue(r,f.col);
      const val=String(raw??"").toLowerCase().trim();
      const fval=(f.val||"").toLowerCase().trim();
      if(f.cond==="contains"&&!val.includes(fval))return false;
      if(f.cond==="equals"&&val!==fval)return false;
      if(f.cond==="starts with"&&!val.startsWith(fval))return false;
      if(f.cond==="ends with"&&!val.endsWith(fval))return false;
      if(f.cond==="is empty"&&val!=="")return false;
      if(f.cond==="is not empty"&&val==="")return false;
      if(f.cond===">"&&!(Number(r[f.col])>Number(fval)))return false;
      if(f.cond==="<"&&!(Number(r[f.col])<Number(fval)))return false;
      if(f.cond==="before"&&!(new Date(r[f.col])<new Date(f.val)))return false;
      if(f.cond==="after"&&!(new Date(r[f.col])>new Date(f.val)))return false;
    }
    return true;
  });

  // ── Sort ──
  if(sortK){
    filtered=[...filtered].sort((a,b)=>{
      const va=a[sortK],vb=b[sortK];
      if(va==null&&vb==null)return 0;if(va==null)return 1;if(vb==null)return -1;
      const isNum=!isNaN(Number(va))&&!isNaN(Number(vb));
      const cmp=isNum?Number(va)-Number(vb):String(va).localeCompare(String(vb),undefined,{numeric:true,sensitivity:"base"});
      return sortD==="asc"?cmp:-cmp;
    });
  }

  // ── Pagination ──
  const total=filtered.length;
  const totalPages=Math.max(1,Math.ceil(total/pageSize));
  const safePage=Math.min(page,totalPages);
  const pageRows=filtered.slice((safePage-1)*pageSize,safePage*pageSize);

  // ── Selection ──
  const pageIds=pageRows.map(r=>r.id).filter(Boolean);
  const allSel=pageIds.length>0&&pageIds.every(id=>selected.has(id));
  const someSel=pageIds.some(id=>selected.has(id));
  const toggleAll=()=>{const n=new Set(selected);if(allSel)pageIds.forEach(id=>n.delete(id));else pageIds.forEach(id=>n.add(id));setSelected(n);};
  const toggleRow=id=>{const n=new Set(selected);n.has(id)?n.delete(id):n.add(id);setSelected(n);};

  const doSort=k=>{if(sortK===k)setSortD(d=>d==="asc"?"desc":"asc");else{setSortK(k);setSortD("asc");}};
  const hasFilters=activeFilters.length>0||activeChip||activeSizeFilter||activeFarmaFilter||activeCustomerCountryFilter||activeCustomerStatusFilter||activeCustomerSizeModeFilter||activeMeasurementSizeModeFilter||activeWorkOrderTypeFilter||activeWorkOrderStatusFilter||activeInventoryFinishFilter||activeInventoryStockFilter||activeUpperStyleFilter||activeUpperSizeFilter||activeUpperFarmaFilter||activeUpperLeatherTypeFilter||activeUpperLeatherColorFilter||activeFarmaCodeFilter||activeLiningColorFilter||activeBuckleColorFilter||activeLaceTypeFilter||activeLaceColorFilter||activeElasticColorFilter||activeElasticWidthFilter||activeThreadTypeFilter||activeThreadColorFilter||activeThreadStatusFilter||q;

  const exportCSV=()=>{
    const sel=selected.size>0?rows.filter(r=>selected.has(r.id)):filtered;
    if(!sel.length)return;
    const ks=Object.keys(sel[0]);
    const csv=[ks.join(","),...sel.map(r=>ks.map(k=>`"${String(r[k]??"").replace(/"/g,'""')}"`).join(","))].join("\n");
    const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download=`${modId}.csv`;a.click();
  };

  const colAlign=c=>{if(c.t==="money"||c.t==="num")return"right";if(c.t==="date"||c.t==="badge"||c.t==="status_done"||c.t==="quality_status"||c.t==="bool")return"center";return"left";};

  const cardImageFor=row=>row.image_url||row.representative_image_url||row.fault_image_url||row.receipt_url||row.foot_img_left||row.quality_fault_image_url||"";
  const cardStatusFor=row=>row.status||row.stock_status||row.work_order_status||row.finish_status||row.delivery_status||row.fault_status||row.usage_status||"";
  const cardNumberFor=(row,i)=>{
    const globalIndex=(safePage-1)*pageSize+i;
    return row.wo_number||row.pair_number||row.upper_number||row.leather_number||row.lining_number||row.buckle_number||row.lace_number||row.elastic_number||row.thread_number||row.customer_number||row.measurement_number||row.serial_number||(total-globalIndex);
  };
  const cardTitleFor=row=>{
    const priority=["type_pattern","style","type","customer_name","name","name_type","color","design_name","belt_name","tool_name","fault_type","knowledge_point","video_type","rule_category"];
    for(const k of priority){if(row[k])return String(row[k]);}
    const col=visibleCols.find(c=>!["img","video","id","bool"].includes(c.t)&&!String(c.k).includes("status"));
    return col?String(row[col.k]||"Record"):"Record";
  };
  const cardMetaCols=visibleCols.filter(c=>!["img","video"].includes(c.t)&&!["id","wo_number","pair_number","upper_number","leather_number","lining_number","buckle_number","lace_number","elastic_number","thread_number","customer_number","measurement_number","serial_number"].includes(c.k)).slice(0,5);

  return <div style={{display:"flex",flexDirection:"column",height:"100%",position:"relative"}}>

    {/* ── KPI Bar — always rendered, context-aware per table ── */}
    {!loading&&(()=>{
      const cfg=KPI_CONFIG[modId]||KPI_CONFIG.default;
      const kpis=cfg(rows);
      if(!kpis||kpis.length===0)return null;
      return(
        <div style={{display:"flex",borderBottom:`1px solid ${C.border}`,background:C.card,
          flexShrink:0,flexWrap:"wrap",position:"sticky",top:0,zIndex:5}}>
          {kpis.map((k,i)=>(
            <div key={k.l} style={{display:"flex",alignItems:"center",gap:10,
              padding:"11px 20px",
              borderRight:i<kpis.length-1?`1px solid ${C.border}`:"none",
              minWidth:0}}>
              <div style={{width:36,height:36,borderRadius:0,
                background:(k.c||C.sub)+"18",
                display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <i className={"ti "+(k.i||"ti-table")} style={{fontSize:14,color:k.c||C.sub}}/>
              </div>
              <div>
                <p style={{fontFamily:C.mono,fontSize:20,fontWeight:800,
                  color:k.c||C.sub,margin:0,lineHeight:1,letterSpacing:"-0.03em"}}>
                  {String(k.v??0)}
                </p>
                <p style={{fontSize:9,color:C.dim,margin:"2px 0 0",
                  textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:600}}>
                  {k.l}
                </p>
              </div>
            </div>
          ))}
        </div>
      );
    })()}

    {/* ── Work Order: Type + Status quick dropdown filters ── */}
    {!loading&&modId==="work_orders"&&(()=>{
      const woTypes=["Upper","Bottom","Finish","Order Local","International Order"];
      const woStatuses=["Pending","Started Working","In Progress","On Hold","Completed","Cancelled"];
      const typeCount=t=>rows.filter(r=>String(r.work_order_type||"").trim().toLowerCase()===t.toLowerCase()).length;
      const statusCount=st=>rows.filter(r=>String(r.work_order_status||"").trim().toLowerCase()===st.toLowerCase()).length;
      return <div style={{display:"flex",gap:12,padding:"8px 16px",borderBottom:`1px solid ${C.border}`,
        background:"#FFFFF8",flexShrink:0,alignItems:"center",flexWrap:"wrap"}}>
        <span style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em",flexShrink:0}}>Quick:</span>
        <label style={{display:"flex",alignItems:"center",gap:7}}>
          <span style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em"}}>WO Type</span>
          <select value={activeWorkOrderTypeFilter} onChange={e=>setActiveWorkOrderTypeFilter(e.target.value)} style={{...C.inp,width:240,padding:"7px 10px",fontSize:12,fontWeight:600,borderColor:C.accent,background:C.card,cursor:"pointer"}}>
            <option value="">All Work Order Types ({rows.length})</option>
            {woTypes.map(t=><option key={t} value={t}>{t} ({typeCount(t)})</option>)}
          </select>
        </label>
        <label style={{display:"flex",alignItems:"center",gap:7}}>
          <span style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em"}}>Status</span>
          <select value={activeWorkOrderStatusFilter} onChange={e=>setActiveWorkOrderStatusFilter(e.target.value)} style={{...C.inp,width:220,padding:"7px 10px",fontSize:12,fontWeight:600,borderColor:C.accent,background:C.card,cursor:"pointer"}}>
            <option value="">All Statuses ({rows.length})</option>
            {woStatuses.map(st=><option key={st} value={st}>{st} ({statusCount(st)})</option>)}
          </select>
        </label>
        {(activeWorkOrderTypeFilter||activeWorkOrderStatusFilter)&&<button onClick={()=>{setActiveWorkOrderTypeFilter("");setActiveWorkOrderStatusFilter("");}}
          style={{background:"none",border:`1px solid ${C.border}`,color:C.sub,borderRadius:0,padding:"6px 12px",cursor:"pointer",fontSize:12}}>Clear</button>}
      </div>;
    })()}

        {/* Sooti / Welt: Welt Type + Color + Status dropdown filters */}
    {!loading&&modId==="sooti"&&(()=>{
      const count=(key,val)=>rows.filter(r=>String(r[key]||"").trim().toLowerCase()===String(val).toLowerCase()).length;
      return <div style={{display:"flex",gap:12,padding:"8px 16px",borderBottom:`1px solid ${C.border}`,
        background:"#FFFFF8",flexShrink:0,alignItems:"center",flexWrap:"wrap"}}>
        <span style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em",flexShrink:0}}>Quick:</span>
        <label style={{display:"flex",alignItems:"center",gap:7}}>
          <span style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em"}}>Welt Type</span>
          <select value={activeSootiWeltTypeFilter} onChange={e=>setActiveSootiWeltTypeFilter(e.target.value)} style={{...C.inp,width:240,padding:"7px 10px",fontSize:12,fontWeight:600,borderColor:C.accent,background:C.card,cursor:"pointer"}}>
            <option value="">All Welt Types ({rows.length})</option>
            {SOOTI_WELT_TYPE_OPTIONS.map(v=><option key={v} value={v}>{v} ({count("welt_type",v)})</option>)}
          </select>
        </label>
        <label style={{display:"flex",alignItems:"center",gap:7}}>
          <span style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em"}}>Color</span>
          <select value={activeSootiColorFilter} onChange={e=>setActiveSootiColorFilter(e.target.value)} style={{...C.inp,width:190,padding:"7px 10px",fontSize:12,fontWeight:600,borderColor:C.accent,background:C.card,cursor:"pointer"}}>
            <option value="">All Colors ({rows.length})</option>
            {SOOTI_COLOR_OPTIONS.map(v=><option key={v} value={v}>{v} ({count("color",v)})</option>)}
          </select>
        </label>
        <label style={{display:"flex",alignItems:"center",gap:7}}>
          <span style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em"}}>Status</span>
          <select value={activeSootiStatusFilter} onChange={e=>setActiveSootiStatusFilter(e.target.value)} style={{...C.inp,width:210,padding:"7px 10px",fontSize:12,fontWeight:600,borderColor:C.accent,background:C.card,cursor:"pointer"}}>
            <option value="">All Status ({rows.length})</option>
            {SOOTI_STATUS_OPTIONS.map(v=><option key={v} value={v}>{v} ({count("status",v)})</option>)}
          </select>
        </label>
        {(activeSootiWeltTypeFilter||activeSootiColorFilter||activeSootiStatusFilter)&&<button onClick={()=>{setActiveSootiWeltTypeFilter("");setActiveSootiColorFilter("");setActiveSootiStatusFilter("");}}
          style={{background:"none",border:`1px solid ${C.border}`,color:C.sub,borderRadius:0,padding:"6px 12px",cursor:"pointer",fontSize:12}}>Clear</button>}
      </div>;
    })()}

        {/* Laser Patterns: RAG dropdown filters */}
    {!loading&&modId==="patterns"&&(()=>{
      const count=(key,val)=>rows.filter(r=>String((key==="pattern_name"?(r.pattern_name||r.pattern_type):r[key])||"").trim().toLowerCase()===String(val).toLowerCase()).length;
      return <div style={{display:"flex",gap:12,padding:"8px 16px",borderBottom:`1px solid ${C.border}`,background:"#FFFFF8",flexShrink:0,alignItems:"center",flexWrap:"wrap"}}>
        <span style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em",flexShrink:0}}>Quick:</span>
        <label style={{display:"flex",alignItems:"center",gap:7}}>
          <span style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em"}}>Pattern</span>
          <select value={activePatternNameFilter} onChange={e=>setActivePatternNameFilter(e.target.value)} style={{...C.inp,width:260,padding:"7px 10px",fontSize:12,fontWeight:600,borderColor:C.accent,background:C.card,cursor:"pointer"}}>
            <option value="">All Patterns ({rows.length})</option>
            {LASER_PATTERN_NAME_OPTIONS.map(v=><option key={v} value={v}>{v} ({count("pattern_name",v)})</option>)}
          </select>
        </label>
        <label style={{display:"flex",alignItems:"center",gap:7}}>
          <span style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em"}}>RAG Status</span>
          <select value={activePatternStatusFilter} onChange={e=>setActivePatternStatusFilter(e.target.value)} style={{...C.inp,width:195,padding:"7px 10px",fontSize:12,fontWeight:600,borderColor:C.accent,background:C.card,cursor:"pointer"}}>
            <option value="">All Status ({rows.length})</option>
            {LASER_PATTERN_STATUS_OPTIONS.map(v=><option key={v} value={v}>{v} ({count("laser_pattern_status",v)})</option>)}
          </select>
        </label>
        {(activePatternNameFilter||activePatternStatusFilter)&&<button onClick={()=>{setActivePatternNameFilter("");setActivePatternStatusFilter("");}} style={{background:"none",border:`1px solid ${C.border}`,color:C.sub,borderRadius:0,padding:"6px 12px",cursor:"pointer",fontSize:12}}>Clear</button>}
      </div>;
    })()}

        {/* Inspiration Library: RAG dropdown filters */}
    {!loading&&modId==="inspiration"&&(()=>{
      const count=(key,val)=>rows.filter(r=>String(r[key]||"").trim().toLowerCase()===String(val).toLowerCase()).length;
      const typeOptions=FT.type_of_inspiration?.opts||[];
      const designOptions=FT.design_type?.opts||[];
      return <div style={{display:"flex",gap:12,padding:"8px 16px",borderBottom:`1px solid ${C.border}`,background:"#FFFFF8",flexShrink:0,alignItems:"center",flexWrap:"wrap"}}>
        <span style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em",flexShrink:0}}>Quick:</span>
        <label style={{display:"flex",alignItems:"center",gap:7}}>
          <span style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em"}}>Type</span>
          <select value={activeInspirationTypeFilter} onChange={e=>setActiveInspirationTypeFilter(e.target.value)} style={{...C.inp,width:215,padding:"7px 10px",fontSize:12,fontWeight:600,borderColor:C.accent,background:C.card,cursor:"pointer"}}>
            <option value="">All Types ({rows.length})</option>
            {typeOptions.map(v=><option key={v} value={v}>{v} ({count("type_of_inspiration",v)})</option>)}
          </select>
        </label>
        <label style={{display:"flex",alignItems:"center",gap:7}}>
          <span style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em"}}>Design</span>
          <select value={activeInspirationDesignFilter} onChange={e=>setActiveInspirationDesignFilter(e.target.value)} style={{...C.inp,width:185,padding:"7px 10px",fontSize:12,fontWeight:600,borderColor:C.accent,background:C.card,cursor:"pointer"}}>
            <option value="">All Designs ({rows.length})</option>
            {designOptions.map(v=><option key={v} value={v}>{v} ({count("design_type",v)})</option>)}
          </select>
        </label>
        <label style={{display:"flex",alignItems:"center",gap:7}}>
          <span style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em"}}>RAG Status</span>
          <select value={activeInspirationStatusFilter} onChange={e=>setActiveInspirationStatusFilter(e.target.value)} style={{...C.inp,width:195,padding:"7px 10px",fontSize:12,fontWeight:600,borderColor:C.accent,background:C.card,cursor:"pointer"}}>
            <option value="">All Status ({rows.length})</option>
            {INSPIRATION_STATUS_OPTIONS.map(v=><option key={v} value={v}>{v} ({count("inspiration_status",v)})</option>)}
          </select>
        </label>
        {(activeInspirationTypeFilter||activeInspirationDesignFilter||activeInspirationStatusFilter)&&<button onClick={()=>{setActiveInspirationTypeFilter("");setActiveInspirationDesignFilter("");setActiveInspirationStatusFilter("");}} style={{background:"none",border:`1px solid ${C.border}`,color:C.sub,borderRadius:0,padding:"6px 12px",cursor:"pointer",fontSize:12}}>Clear</button>}
      </div>;
    })()}

        {/* SOPs: Category dropdown filter */}
    {!loading&&modId==="sops"&&(()=>{
      const countCategory=(val)=>rows.filter(r=>String(r.rule_category||"").trim().toLowerCase()===String(val).toLowerCase()).length;
      return <div style={{display:"flex",gap:12,padding:"8px 16px",borderBottom:`1px solid ${C.border}`,background:"#FFFFF8",flexShrink:0,alignItems:"center",flexWrap:"wrap"}}>
        <span style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em",flexShrink:0}}>Quick:</span>
        <label style={{display:"flex",alignItems:"center",gap:7}}>
          <span style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em"}}>Category</span>
          <select value={activeSopCategoryFilter} onChange={e=>setActiveSopCategoryFilter(e.target.value)} style={{...C.inp,width:220,padding:"7px 10px",fontSize:12,fontWeight:600,borderColor:C.accent,background:C.card,cursor:"pointer"}}>
            <option value="">All Categories ({rows.length})</option>
            {RULE_CATEGORY_OPTIONS.map(v=><option key={v} value={v}>{v} ({countCategory(v)})</option>)}
          </select>
        </label>
        {activeSopCategoryFilter&&<button onClick={()=>setActiveSopCategoryFilter("")} style={{background:"none",border:`1px solid ${C.border}`,color:C.sub,borderRadius:0,padding:"6px 12px",cursor:"pointer",fontSize:12}}>Clear</button>}
      </div>;
    })()}

        {/* Rule Book: Category + Active dropdown filters */}
    {!loading&&modId==="rules"&&(()=>{
      const countCategory=(val)=>rows.filter(r=>String(r.rule_category||"").trim().toLowerCase()===String(val).toLowerCase()).length;
      const countActive=(val)=>rows.filter(r=>((r.is_active===true||String(r.is_active).toLowerCase()==="true"||String(r.is_active).toLowerCase()==="yes")?"Yes":"No")===val).length;
      return <div style={{display:"flex",gap:12,padding:"8px 16px",borderBottom:`1px solid ${C.border}`,background:"#FFFFF8",flexShrink:0,alignItems:"center",flexWrap:"wrap"}}>
        <span style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em",flexShrink:0}}>Quick:</span>
        <label style={{display:"flex",alignItems:"center",gap:7}}>
          <span style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em"}}>Category</span>
          <select value={activeRuleCategoryFilter} onChange={e=>setActiveRuleCategoryFilter(e.target.value)} style={{...C.inp,width:220,padding:"7px 10px",fontSize:12,fontWeight:600,borderColor:C.accent,background:C.card,cursor:"pointer"}}>
            <option value="">All Categories ({rows.length})</option>
            {RULE_CATEGORY_OPTIONS.map(v=><option key={v} value={v}>{v} ({countCategory(v)})</option>)}
          </select>
        </label>
        <label style={{display:"flex",alignItems:"center",gap:7}}>
          <span style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em"}}>Active</span>
          <select value={activeRuleActiveFilter} onChange={e=>setActiveRuleActiveFilter(e.target.value)} style={{...C.inp,width:150,padding:"7px 10px",fontSize:12,fontWeight:600,borderColor:C.accent,background:C.card,cursor:"pointer"}}>
            <option value="">All ({rows.length})</option>
            {RULE_ACTIVE_OPTIONS.map(v=><option key={v} value={v}>{v} ({countActive(v)})</option>)}
          </select>
        </label>
        {(activeRuleCategoryFilter||activeRuleActiveFilter)&&<button onClick={()=>{setActiveRuleCategoryFilter("");setActiveRuleActiveFilter("");}} style={{background:"none",border:`1px solid ${C.border}`,color:C.sub,borderRadius:0,padding:"6px 12px",cursor:"pointer",fontSize:12}}>Clear</button>}
      </div>;
    })()}

        {/* Income / Sales: Unit Type + Payment Type dropdown filters */}
    {!loading&&modId==="income"&&(()=>{
      const unitTypeOptions=FT.income_unit_type?.opts||[];
      const paymentTypeOptions=FT.payment_type?.opts||[];
      const count=(key,val)=>rows.filter(r=>String(r[key]||"").trim().toLowerCase()===String(val).toLowerCase()).length;
      return <div style={{display:"flex",gap:12,padding:"8px 16px",borderBottom:`1px solid ${C.border}`,background:"#FFFFF8",flexShrink:0,alignItems:"center",flexWrap:"wrap"}}>
        <span style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em",flexShrink:0}}>Quick:</span>
        <label style={{display:"flex",alignItems:"center",gap:7}}>
          <span style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em"}}>Unit Type</span>
          <select value={activeIncomeUnitTypeFilter} onChange={e=>setActiveIncomeUnitTypeFilter(e.target.value)} style={{...C.inp,width:210,padding:"7px 10px",fontSize:12,fontWeight:600,borderColor:C.accent,background:C.card,cursor:"pointer"}}>
            <option value="">All Unit Types ({rows.length})</option>
            {unitTypeOptions.map(v=><option key={v} value={v}>{v} ({count("unit_type",v)})</option>)}
          </select>
        </label>
        <label style={{display:"flex",alignItems:"center",gap:7}}>
          <span style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em"}}>Payment Type</span>
          <select value={activeIncomePaymentTypeFilter} onChange={e=>setActiveIncomePaymentTypeFilter(e.target.value)} style={{...C.inp,width:220,padding:"7px 10px",fontSize:12,fontWeight:600,borderColor:C.accent,background:C.card,cursor:"pointer"}}>
            <option value="">All Payment Types ({rows.length})</option>
            {paymentTypeOptions.map(v=><option key={v} value={v}>{v} ({count("payment_type",v)})</option>)}
          </select>
        </label>
        {(activeIncomeUnitTypeFilter||activeIncomePaymentTypeFilter)&&<button onClick={()=>{setActiveIncomeUnitTypeFilter("");setActiveIncomePaymentTypeFilter("");}} style={{background:"none",border:`1px solid ${C.border}`,color:C.sub,borderRadius:0,padding:"6px 12px",cursor:"pointer",fontSize:12}}>Clear</button>}
      </div>;
    })()}

        {/* Petty Cash Ledger: Category dropdown filter */}
    {!loading&&modId==="expenses"&&(()=>{
      const categoryOptions=FT.expense_category?.opts||[];
      const count=(val)=>rows.filter(r=>String(r.expense_category||"").trim().toLowerCase()===String(val).toLowerCase()).length;
      return <div style={{display:"flex",gap:12,padding:"8px 16px",borderBottom:`1px solid ${C.border}`,background:"#FFFFF8",flexShrink:0,alignItems:"center",flexWrap:"wrap"}}>
        <span style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em",flexShrink:0}}>Quick:</span>
        <label style={{display:"flex",alignItems:"center",gap:7}}>
          <span style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em"}}>Category</span>
          <select value={activeExpenseCategoryFilter} onChange={e=>setActiveExpenseCategoryFilter(e.target.value)} style={{...C.inp,width:260,padding:"7px 10px",fontSize:12,fontWeight:600,borderColor:C.accent,background:C.card,cursor:"pointer"}}>
            <option value="">All Categories ({rows.length})</option>
            {categoryOptions.map(v=><option key={v} value={v}>{v} ({count(v)})</option>)}
          </select>
        </label>
        {activeExpenseCategoryFilter&&<button onClick={()=>setActiveExpenseCategoryFilter("")} style={{background:"none",border:`1px solid ${C.border}`,color:C.sub,borderRadius:0,padding:"6px 12px",cursor:"pointer",fontSize:12}}>Clear</button>}
      </div>;
    })()}

        {/* Shoe Polish: Color + Company + Type + Status dropdown filters */}
    {!loading&&modId==="polish"&&(()=>{
      const count=(key,val)=>rows.filter(r=>String(r[key]||"").trim().toLowerCase()===String(val).toLowerCase()).length;
      return <div style={{display:"flex",gap:12,padding:"8px 16px",borderBottom:`1px solid ${C.border}`,background:"#FFFFF8",flexShrink:0,alignItems:"center",flexWrap:"wrap"}}>
        <span style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em",flexShrink:0}}>Quick:</span>
        <label style={{display:"flex",alignItems:"center",gap:7}}>
          <span style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em"}}>Color</span>
          <select value={activePolishColorFilter} onChange={e=>setActivePolishColorFilter(e.target.value)} style={{...C.inp,width:180,padding:"7px 10px",fontSize:12,fontWeight:600,borderColor:C.accent,background:C.card,cursor:"pointer"}}>
            <option value="">All Colors ({rows.length})</option>
            {POLISH_COLOR_OPTIONS.map(v=><option key={v} value={v}>{v} ({count("color",v)})</option>)}
          </select>
        </label>
        <label style={{display:"flex",alignItems:"center",gap:7}}>
          <span style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em"}}>Company</span>
          <select value={activePolishCompanyFilter} onChange={e=>setActivePolishCompanyFilter(e.target.value)} style={{...C.inp,width:210,padding:"7px 10px",fontSize:12,fontWeight:600,borderColor:C.accent,background:C.card,cursor:"pointer"}}>
            <option value="">All Companies ({rows.length})</option>
            {POLISH_COMPANY_OPTIONS.map(v=><option key={v} value={v}>{v} ({count("company",v)})</option>)}
          </select>
        </label>
        <label style={{display:"flex",alignItems:"center",gap:7}}>
          <span style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em"}}>Type</span>
          <select value={activePolishTypeFilter} onChange={e=>setActivePolishTypeFilter(e.target.value)} style={{...C.inp,width:165,padding:"7px 10px",fontSize:12,fontWeight:600,borderColor:C.accent,background:C.card,cursor:"pointer"}}>
            <option value="">All Types ({rows.length})</option>
            {POLISH_TYPE_OPTIONS.map(v=><option key={v} value={v}>{v} ({count("type",v)})</option>)}
          </select>
        </label>
        <label style={{display:"flex",alignItems:"center",gap:7}}>
          <span style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em"}}>Status</span>
          <select value={activePolishStatusFilter} onChange={e=>setActivePolishStatusFilter(e.target.value)} style={{...C.inp,width:190,padding:"7px 10px",fontSize:12,fontWeight:600,borderColor:C.accent,background:C.card,cursor:"pointer"}}>
            <option value="">All Status ({rows.length})</option>
            {POLISH_STATUS_OPTIONS.map(v=><option key={v} value={v}>{v} ({count("status",v)})</option>)}
          </select>
        </label>
        {(activePolishColorFilter||activePolishCompanyFilter||activePolishTypeFilter||activePolishStatusFilter)&&<button onClick={()=>{setActivePolishColorFilter("");setActivePolishCompanyFilter("");setActivePolishTypeFilter("");setActivePolishStatusFilter("");}} style={{background:"none",border:`1px solid ${C.border}`,color:C.sub,borderRadius:0,padding:"6px 12px",cursor:"pointer",fontSize:12}}>Clear</button>}
      </div>;
    })()}

        {/* Dye Color: Color + Status dropdown filters */}
    {!loading&&modId==="finishing"&&(()=>{
      const count=(key,val)=>rows.filter(r=>String(r[key]||"").trim().toLowerCase()===String(val).toLowerCase()).length;
      return <div style={{display:"flex",gap:12,padding:"8px 16px",borderBottom:`1px solid ${C.border}`,background:"#FFFFF8",flexShrink:0,alignItems:"center",flexWrap:"wrap"}}>
        <span style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em",flexShrink:0}}>Quick:</span>
        <label style={{display:"flex",alignItems:"center",gap:7}}>
          <span style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em"}}>Color</span>
          <select value={activeDyeColorFilter} onChange={e=>setActiveDyeColorFilter(e.target.value)} style={{...C.inp,width:230,padding:"7px 10px",fontSize:12,fontWeight:600,borderColor:C.accent,background:C.card,cursor:"pointer"}}>
            <option value="">All Colors ({rows.length})</option>
            {DYE_COLOR_OPTIONS.map(v=><option key={v} value={v}>{v} ({count("color",v)})</option>)}
          </select>
        </label>
        <label style={{display:"flex",alignItems:"center",gap:7}}>
          <span style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em"}}>Status</span>
          <select value={activeDyeStatusFilter} onChange={e=>setActiveDyeStatusFilter(e.target.value)} style={{...C.inp,width:190,padding:"7px 10px",fontSize:12,fontWeight:600,borderColor:C.accent,background:C.card,cursor:"pointer"}}>
            <option value="">All Status ({rows.length})</option>
            {DYE_STATUS_OPTIONS.map(v=><option key={v} value={v}>{v} ({count("status",v)})</option>)}
          </select>
        </label>
        {(activeDyeColorFilter||activeDyeStatusFilter)&&<button onClick={()=>{setActiveDyeColorFilter("");setActiveDyeStatusFilter("");}} style={{background:"none",border:`1px solid ${C.border}`,color:C.sub,borderRadius:0,padding:"6px 12px",cursor:"pointer",fontSize:12}}>Clear</button>}
      </div>;
    })()}

        {/* MEK Sheet: Thickness + Status dropdown filters */}
    {!loading&&modId==="mek"&&(()=>{
      const unique=(key)=>[...new Set(rows.map(r=>String(r[key]||"").trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
      const count=(key,val)=>rows.filter(r=>String(r[key]||"").trim().toLowerCase()===String(val).toLowerCase()).length;
      const thicknessOptions=unique("thickness");
      return <div style={{display:"flex",gap:12,padding:"8px 16px",borderBottom:`1px solid ${C.border}`,background:"#FFFFF8",flexShrink:0,alignItems:"center",flexWrap:"wrap"}}>
        <span style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em",flexShrink:0}}>Quick:</span>
        <label style={{display:"flex",alignItems:"center",gap:7}}>
          <span style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em"}}>Thickness</span>
          <select value={activeMekThicknessFilter} onChange={e=>setActiveMekThicknessFilter(e.target.value)} style={{...C.inp,width:205,padding:"7px 10px",fontSize:12,fontWeight:600,borderColor:C.accent,background:C.card,cursor:"pointer"}}>
            <option value="">All Thickness ({rows.length})</option>
            {thicknessOptions.map(v=><option key={v} value={v}>{v} ({count("thickness",v)})</option>)}
          </select>
        </label>
        <label style={{display:"flex",alignItems:"center",gap:7}}>
          <span style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em"}}>Status</span>
          <select value={activeMekStatusFilter} onChange={e=>setActiveMekStatusFilter(e.target.value)} style={{...C.inp,width:210,padding:"7px 10px",fontSize:12,fontWeight:600,borderColor:C.accent,background:C.card,cursor:"pointer"}}>
            <option value="">All Status ({rows.length})</option>
            {MEK_STATUS_OPTIONS.map(v=><option key={v} value={v}>{v} ({count("status",v)})</option>)}
          </select>
        </label>
        {(activeMekThicknessFilter||activeMekStatusFilter)&&<button onClick={()=>{setActiveMekThicknessFilter("");setActiveMekStatusFilter("");}} style={{background:"none",border:`1px solid ${C.border}`,color:C.sub,borderRadius:0,padding:"6px 12px",cursor:"pointer",fontSize:12}}>Clear</button>}
      </div>;
    })()}

        {/* Leather Board: Name + Status dropdown filters */}
    {!loading&&modId==="leather_board"&&(()=>{
      const unique=(key)=>[...new Set(rows.map(r=>String(r[key]||"").trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
      const count=(key,val)=>rows.filter(r=>String(r[key]||"").trim().toLowerCase()===String(val).toLowerCase()).length;
      const nameOptions=unique("name_type");
      return <div style={{display:"flex",gap:12,padding:"8px 16px",borderBottom:`1px solid ${C.border}`,background:"#FFFFF8",flexShrink:0,alignItems:"center",flexWrap:"wrap"}}>
        <span style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em",flexShrink:0}}>Quick:</span>
        <label style={{display:"flex",alignItems:"center",gap:7}}>
          <span style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em"}}>Name / Type</span>
          <select value={activeLeatherBoardNameFilter} onChange={e=>setActiveLeatherBoardNameFilter(e.target.value)} style={{...C.inp,width:240,padding:"7px 10px",fontSize:12,fontWeight:600,borderColor:C.accent,background:C.card,cursor:"pointer"}}>
            <option value="">All Names ({rows.length})</option>
            {nameOptions.map(v=><option key={v} value={v}>{v} ({count("name_type",v)})</option>)}
          </select>
        </label>
        <label style={{display:"flex",alignItems:"center",gap:7}}>
          <span style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em"}}>Status</span>
          <select value={activeLeatherBoardStatusFilter} onChange={e=>setActiveLeatherBoardStatusFilter(e.target.value)} style={{...C.inp,width:210,padding:"7px 10px",fontSize:12,fontWeight:600,borderColor:C.accent,background:C.card,cursor:"pointer"}}>
            <option value="">All Status ({rows.length})</option>
            {LEATHER_BOARD_STATUS_OPTIONS.map(v=><option key={v} value={v}>{v} ({count("status",v)})</option>)}
          </select>
        </label>
        {(activeLeatherBoardNameFilter||activeLeatherBoardStatusFilter)&&<button onClick={()=>{setActiveLeatherBoardNameFilter("");setActiveLeatherBoardStatusFilter("");}} style={{background:"none",border:`1px solid ${C.border}`,color:C.sub,borderRadius:0,padding:"6px 12px",cursor:"pointer",fontSize:12}}>Clear</button>}
      </div>;
    })()}

        {/* Heel Top / Tapi: Type + Thickness + Status dropdown filters */}
    {!loading&&modId==="heel_tops"&&(()=>{
      const unique=(key)=>[...new Set(rows.map(r=>String(r[key]||"").trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
      const count=(key,val)=>rows.filter(r=>String(r[key]||"").trim().toLowerCase()===String(val).toLowerCase()).length;
      const thicknessOptions=unique("thickness_mm");
      return <div style={{display:"flex",gap:12,padding:"8px 16px",borderBottom:`1px solid ${C.border}`,background:"#FFFFF8",flexShrink:0,alignItems:"center",flexWrap:"wrap"}}>
        <span style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em",flexShrink:0}}>Quick:</span>
        <label style={{display:"flex",alignItems:"center",gap:7}}>
          <span style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em"}}>Type</span>
          <select value={activeTapiTypeFilter} onChange={e=>setActiveTapiTypeFilter(e.target.value)} style={{...C.inp,width:220,padding:"7px 10px",fontSize:12,fontWeight:600,borderColor:C.accent,background:C.card,cursor:"pointer"}}>
            <option value="">All Types ({rows.length})</option>
            {HEEL_TOP_TYPE_OPTIONS.map(v=><option key={v} value={v}>{v} ({count("type",v)})</option>)}
          </select>
        </label>
        <label style={{display:"flex",alignItems:"center",gap:7}}>
          <span style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em"}}>Thickness</span>
          <select value={activeTapiThicknessFilter} onChange={e=>setActiveTapiThicknessFilter(e.target.value)} style={{...C.inp,width:190,padding:"7px 10px",fontSize:12,fontWeight:600,borderColor:C.accent,background:C.card,cursor:"pointer"}}>
            <option value="">All Thickness ({rows.length})</option>
            {thicknessOptions.map(v=><option key={v} value={v}>{v} ({count("thickness_mm",v)})</option>)}
          </select>
        </label>
        <label style={{display:"flex",alignItems:"center",gap:7}}>
          <span style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em"}}>Status</span>
          <select value={activeTapiStatusFilter} onChange={e=>setActiveTapiStatusFilter(e.target.value)} style={{...C.inp,width:220,padding:"7px 10px",fontSize:12,fontWeight:600,borderColor:C.accent,background:C.card,cursor:"pointer"}}>
            <option value="">All Status ({rows.length})</option>
            {HEEL_TOP_STATUS_OPTIONS.map(v=><option key={v} value={v}>{v} ({count("status",v)})</option>)}
          </select>
        </label>
        {(activeTapiTypeFilter||activeTapiThicknessFilter||activeTapiStatusFilter)&&<button onClick={()=>{setActiveTapiTypeFilter("");setActiveTapiThicknessFilter("");setActiveTapiStatusFilter("");}} style={{background:"none",border:`1px solid ${C.border}`,color:C.sub,borderRadius:0,padding:"6px 12px",cursor:"pointer",fontSize:12}}>Clear</button>}
      </div>;
    })()}

        {/* Sole Sheets: Name + Color + Status dropdown filters */}
    {!loading&&modId==="sole_sheets"&&(()=>{
      const unique=(key)=>[...new Set(rows.map(r=>String(r[key]||"").trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
      const count=(key,val)=>rows.filter(r=>String(r[key]||"").trim().toLowerCase()===String(val).toLowerCase()).length;
      const nameOptions=unique("name");
      const colorOptions=unique("color");
      return <div style={{display:"flex",gap:12,padding:"8px 16px",borderBottom:`1px solid ${C.border}`,
        background:"#FFFFF8",flexShrink:0,alignItems:"center",flexWrap:"wrap"}}>
        <span style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em",flexShrink:0}}>Quick:</span>
        <label style={{display:"flex",alignItems:"center",gap:7}}>
          <span style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em"}}>Name / Type</span>
          <select value={activeSoleSheetNameFilter} onChange={e=>setActiveSoleSheetNameFilter(e.target.value)} style={{...C.inp,width:240,padding:"7px 10px",fontSize:12,fontWeight:600,borderColor:C.accent,background:C.card,cursor:"pointer"}}>
            <option value="">All Names ({rows.length})</option>
            {nameOptions.map(v=><option key={v} value={v}>{v} ({count("name",v)})</option>)}
          </select>
        </label>
        <label style={{display:"flex",alignItems:"center",gap:7}}>
          <span style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em"}}>Color</span>
          <select value={activeSoleSheetColorFilter} onChange={e=>setActiveSoleSheetColorFilter(e.target.value)} style={{...C.inp,width:190,padding:"7px 10px",fontSize:12,fontWeight:600,borderColor:C.accent,background:C.card,cursor:"pointer"}}>
            <option value="">All Colors ({rows.length})</option>
            {colorOptions.map(v=><option key={v} value={v}>{v} ({count("color",v)})</option>)}
          </select>
        </label>
        <label style={{display:"flex",alignItems:"center",gap:7}}>
          <span style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em"}}>Status</span>
          <select value={activeSoleSheetStatusFilter} onChange={e=>setActiveSoleSheetStatusFilter(e.target.value)} style={{...C.inp,width:210,padding:"7px 10px",fontSize:12,fontWeight:600,borderColor:C.accent,background:C.card,cursor:"pointer"}}>
            <option value="">All Status ({rows.length})</option>
            {SOLE_SHEET_STATUS_OPTIONS.map(v=><option key={v} value={v}>{v} ({count("status",v)})</option>)}
          </select>
        </label>
        {(activeSoleSheetNameFilter||activeSoleSheetColorFilter||activeSoleSheetStatusFilter)&&<button onClick={()=>{setActiveSoleSheetNameFilter("");setActiveSoleSheetColorFilter("");setActiveSoleSheetStatusFilter("");}}
          style={{background:"none",border:`1px solid ${C.border}`,color:C.sub,borderRadius:0,padding:"6px 12px",cursor:"pointer",fontSize:12}}>Clear</button>}
      </div>;
    })()}

{/* ── Heel: Type + Thickness + Thickness Type dropdown filters ── */}
    {!loading&&modId==="heels"&&(()=>{
      const count=(key,val)=>rows.filter(r=>String(r[key]||"").trim().toLowerCase()===String(val).toLowerCase()).length;
      return <div style={{display:"flex",gap:12,padding:"8px 16px",borderBottom:`1px solid ${C.border}`,
        background:"#FFFFF8",flexShrink:0,alignItems:"center",flexWrap:"wrap"}}>
        <span style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em",flexShrink:0}}>Quick:</span>
        <label style={{display:"flex",alignItems:"center",gap:7}}>
          <span style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em"}}>Heel Type</span>
          <select value={activeHeelTypeFilter} onChange={e=>setActiveHeelTypeFilter(e.target.value)} style={{...C.inp,width:210,padding:"7px 10px",fontSize:12,fontWeight:600,borderColor:C.accent,background:C.card,cursor:"pointer"}}>
            <option value="">All Heel Types ({rows.length})</option>
            {HEEL_TYPE_OPTIONS.map(v=><option key={v} value={v}>{v} ({count("heel_type",v)})</option>)}
          </select>
        </label>
        <label style={{display:"flex",alignItems:"center",gap:7}}>
          <span style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em"}}>Thickness</span>
          <select value={activeHeelThicknessFilter} onChange={e=>setActiveHeelThicknessFilter(e.target.value)} style={{...C.inp,width:190,padding:"7px 10px",fontSize:12,fontWeight:600,borderColor:C.accent,background:C.card,cursor:"pointer"}}>
            <option value="">All Thickness ({rows.length})</option>
            {HEEL_THICKNESS_OPTIONS.map(v=><option key={v} value={v}>{v} ({count("thickness",v)})</option>)}
          </select>
        </label>
        <label style={{display:"flex",alignItems:"center",gap:7}}>
          <span style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em"}}>Thickness Type</span>
          <select value={activeHeelThicknessTypeFilter} onChange={e=>setActiveHeelThicknessTypeFilter(e.target.value)} style={{...C.inp,width:220,padding:"7px 10px",fontSize:12,fontWeight:600,borderColor:C.accent,background:C.card,cursor:"pointer"}}>
            <option value="">All Thickness Types ({rows.length})</option>
            {HEEL_THICKNESS_TYPE_OPTIONS.map(v=><option key={v} value={v}>{v} ({count("thickness_type",v)})</option>)}
          </select>
        </label>
        {(activeHeelTypeFilter||activeHeelThicknessFilter||activeHeelThicknessTypeFilter)&&<button onClick={()=>{setActiveHeelTypeFilter("");setActiveHeelThicknessFilter("");setActiveHeelThicknessTypeFilter("");}}
          style={{background:"none",border:`1px solid ${C.border}`,color:C.sub,borderRadius:0,padding:"6px 12px",cursor:"pointer",fontSize:12}}>Clear</button>}
      </div>;
    })()}

    {/* ── Thread: Type + Color + Status dropdown filters ── */}
    {!loading&&modId==="thread"&&(()=>{
      const typeOptions=Array.from(new Set(rows.map(r=>String(r.type||"").trim()).filter(Boolean))).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
      const colorOptions=[...Array.from(new Set(rows.map(r=>String(r.color||"").trim()).filter(Boolean))).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true})),"__missing__"];
      const statusOptions=THREAD_STATUS_OPTIONS;
      const countType=v=>rows.filter(r=>String(r.type||"").trim().toLowerCase()===String(v).toLowerCase()).length;
      const countColor=v=>v==="__missing__"?rows.filter(r=>!String(r.color||"").trim()).length:rows.filter(r=>String(r.color||"").trim().toLowerCase()===String(v).toLowerCase()).length;
      const countStatus=v=>rows.filter(r=>String(r.status||"").trim().toLowerCase()===String(v).toLowerCase()).length;
      return <div style={{display:"flex",gap:12,padding:"8px 16px",borderBottom:`1px solid ${C.border}`,
        background:"#FFFFF8",flexShrink:0,alignItems:"center",flexWrap:"wrap"}}>
        <span style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em",flexShrink:0}}>Quick:</span>
        <label style={{display:"flex",alignItems:"center",gap:7}}>
          <span style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em"}}>Type</span>
          <select value={activeThreadTypeFilter} onChange={e=>setActiveThreadTypeFilter(e.target.value)} style={{...C.inp,width:210,padding:"7px 10px",fontSize:12,fontWeight:600,borderColor:C.accent,background:C.card,cursor:"pointer"}}>
            <option value="">All Types ({rows.length})</option>
            {typeOptions.map(v=><option key={v} value={v}>{v} ({countType(v)})</option>)}
          </select>
        </label>
        <label style={{display:"flex",alignItems:"center",gap:7}}>
          <span style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em"}}>Color</span>
          <select value={activeThreadColorFilter} onChange={e=>setActiveThreadColorFilter(e.target.value)} style={{...C.inp,width:220,padding:"7px 10px",fontSize:12,fontWeight:600,borderColor:C.accent,background:C.card,cursor:"pointer"}}>
            <option value="">All Colors ({rows.length})</option>
            {colorOptions.map(v=><option key={v} value={v}>{v==="__missing__"?"Missing Color":v} ({countColor(v)})</option>)}
          </select>
        </label>
        <label style={{display:"flex",alignItems:"center",gap:7}}>
          <span style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em"}}>Status</span>
          <select value={activeThreadStatusFilter} onChange={e=>setActiveThreadStatusFilter(e.target.value)} style={{...C.inp,width:210,padding:"7px 10px",fontSize:12,fontWeight:600,borderColor:C.accent,background:C.card,cursor:"pointer"}}>
            <option value="">All Status ({rows.length})</option>
            {statusOptions.map(v=><option key={v} value={v}>{v} ({countStatus(v)})</option>)}
          </select>
        </label>
        {(activeThreadTypeFilter||activeThreadColorFilter||activeThreadStatusFilter)&&<button onClick={()=>{setActiveThreadTypeFilter("");setActiveThreadColorFilter("");setActiveThreadStatusFilter("");}}
          style={{background:"none",border:`1px solid ${C.border}`,color:C.sub,borderRadius:0,padding:"6px 12px",cursor:"pointer",fontSize:12}}>Clear</button>}
      </div>;
    })()}

    {/* ── Elastic: Color + Width dropdown filters ── */}
    {!loading&&modId==="elastic"&&(()=>{
      const colorOptions=[...Array.from(new Set(rows.map(r=>String(r.color||"").trim()).filter(Boolean))).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true})),"__missing__"];
      const widthOptions=[...Array.from(new Set(rows.map(r=>String(r.width||"").trim()).filter(Boolean))).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true})),"__missing__"];
      const countColor=v=>v==="__missing__"?rows.filter(r=>!String(r.color||"").trim()).length:rows.filter(r=>String(r.color||"").trim().toLowerCase()===String(v).toLowerCase()).length;
      const countWidth=v=>v==="__missing__"?rows.filter(r=>!String(r.width||"").trim()).length:rows.filter(r=>String(r.width||"").trim().toLowerCase()===String(v).toLowerCase()).length;
      return <div style={{display:"flex",gap:12,padding:"8px 16px",borderBottom:`1px solid ${C.border}`,
        background:"#FFFFF8",flexShrink:0,alignItems:"center",flexWrap:"wrap"}}>
        <span style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em",flexShrink:0}}>Quick:</span>
        <label style={{display:"flex",alignItems:"center",gap:7}}>
          <span style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em"}}>Color</span>
          <select value={activeElasticColorFilter} onChange={e=>setActiveElasticColorFilter(e.target.value)} style={{...C.inp,width:230,padding:"7px 10px",fontSize:12,fontWeight:600,borderColor:C.accent,background:C.card,cursor:"pointer"}}>
            <option value="">All Colors ({rows.length})</option>
            {colorOptions.map(v=><option key={v} value={v}>{v==="__missing__"?"Missing Color":v} ({countColor(v)})</option>)}
          </select>
        </label>
        <label style={{display:"flex",alignItems:"center",gap:7}}>
          <span style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em"}}>Width</span>
          <select value={activeElasticWidthFilter} onChange={e=>setActiveElasticWidthFilter(e.target.value)} style={{...C.inp,width:210,padding:"7px 10px",fontSize:12,fontWeight:600,borderColor:C.accent,background:C.card,cursor:"pointer"}}>
            <option value="">All Widths ({rows.length})</option>
            {widthOptions.map(v=><option key={v} value={v}>{v==="__missing__"?"Missing Width":v} ({countWidth(v)})</option>)}
          </select>
        </label>
        {(activeElasticColorFilter||activeElasticWidthFilter)&&<button onClick={()=>{setActiveElasticColorFilter("");setActiveElasticWidthFilter("");}}
          style={{background:"none",border:`1px solid ${C.border}`,color:C.sub,borderRadius:0,padding:"6px 12px",cursor:"pointer",fontSize:12}}>Clear</button>}
      </div>;
    })()}

    {/* ── Laces: Type + Color dropdown filters ── */}
    {!loading&&modId==="laces"&&(()=>{
      const typeOptions=Array.from(new Set(rows.map(r=>String(r.lace_type||"").trim()).filter(Boolean))).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
      const colorOptions=[...Array.from(new Set(rows.map(r=>String(r.color||"").trim()).filter(Boolean))).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true})),"__missing__"];
      const countType=v=>rows.filter(r=>String(r.lace_type||"").trim().toLowerCase()===String(v).toLowerCase()).length;
      const countColor=v=>v==="__missing__"?rows.filter(r=>!String(r.color||"").trim()).length:rows.filter(r=>laceColorMatches(r,v)).length;
      return <div style={{display:"flex",gap:12,padding:"8px 16px",borderBottom:`1px solid ${C.border}`,
        background:"#FFFFF8",flexShrink:0,alignItems:"center",flexWrap:"wrap"}}>
        <span style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em",flexShrink:0}}>Quick:</span>
        <label style={{display:"flex",alignItems:"center",gap:7}}>
          <span style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em"}}>Type</span>
          <select value={activeLaceTypeFilter} onChange={e=>setActiveLaceTypeFilter(e.target.value)} style={{...C.inp,width:210,padding:"7px 10px",fontSize:12,fontWeight:600,borderColor:C.accent,background:C.card,cursor:"pointer"}}>
            <option value="">All Types ({rows.length})</option>
            {typeOptions.map(v=><option key={v} value={v}>{v} ({countType(v)})</option>)}
          </select>
        </label>
        <label style={{display:"flex",alignItems:"center",gap:7}}>
          <span style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em"}}>Color</span>
          <select value={activeLaceColorFilter} onChange={e=>setActiveLaceColorFilter(e.target.value)} style={{...C.inp,width:230,padding:"7px 10px",fontSize:12,fontWeight:600,borderColor:C.accent,background:C.card,cursor:"pointer"}}>
            <option value="">All Colors ({rows.length})</option>
            {colorOptions.map(v=><option key={v} value={v}>{v==="__missing__"?"Missing Color":v} ({countColor(v)})</option>)}
          </select>
        </label>
        {(activeLaceTypeFilter||activeLaceColorFilter)&&<button onClick={()=>{setActiveLaceTypeFilter("");setActiveLaceColorFilter("");}}
          style={{background:"none",border:`1px solid ${C.border}`,color:C.sub,borderRadius:0,padding:"6px 12px",cursor:"pointer",fontSize:12}}>Clear</button>}
      </div>;
    })()}

    {/* ── Buckle: Color dropdown filter ── */}
    {!loading&&modId==="buckles"&&(()=>{
      const usedColors=Array.from(new Set(rows.map(r=>String(r.color||"").trim()).filter(Boolean))).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
      const colorOptions=[...usedColors,"__missing__"];
      const countColor=v=>v==="__missing__"?rows.filter(r=>!String(r.color||"").trim()).length:rows.filter(r=>buckleColorMatches(r,v)).length;
      return <div style={{display:"flex",gap:12,padding:"8px 16px",borderBottom:`1px solid ${C.border}`,
        background:"#FFFFF8",flexShrink:0,alignItems:"center",flexWrap:"wrap"}}>
        <span style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em",flexShrink:0}}>Quick:</span>
        <label style={{display:"flex",alignItems:"center",gap:7}}>
          <span style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em"}}>Color</span>
          <select value={activeBuckleColorFilter} onChange={e=>setActiveBuckleColorFilter(e.target.value)} style={{...C.inp,width:240,padding:"7px 10px",fontSize:12,fontWeight:600,borderColor:C.accent,background:C.card,cursor:"pointer"}}>
            <option value="">All Colors ({rows.length})</option>
            {colorOptions.map(v=><option key={v} value={v}>{v==="__missing__"?"Missing Color":v} ({countColor(v)})</option>)}
          </select>
        </label>
        {activeBuckleColorFilter&&<button onClick={()=>setActiveBuckleColorFilter("")}
          style={{background:"none",border:`1px solid ${C.border}`,color:C.sub,borderRadius:0,padding:"6px 12px",cursor:"pointer",fontSize:12}}>Clear</button>}
      </div>;
    })()}

    {/* ── Lining Leather: Color dropdown filter ── */}
    {!loading&&modId==="lining_leather"&&(()=>{
      const usedColors=Array.from(new Set(rows.map(r=>inferLeatherColor(r)).filter(Boolean))).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
      const colorOptions=[...usedColors,"__missing__"];
      const countColor=v=>v==="__missing__"?rows.filter(r=>!inferLeatherColor(r)).length:rows.filter(r=>leatherColorMatches(r,v)).length;
      return <div style={{display:"flex",gap:12,padding:"8px 16px",borderBottom:`1px solid ${C.border}`,
        background:"#FFFFF8",flexShrink:0,alignItems:"center",flexWrap:"wrap"}}>
        <span style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em",flexShrink:0}}>Quick:</span>
        <label style={{display:"flex",alignItems:"center",gap:7}}>
          <span style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em"}}>Color</span>
          <select value={activeLiningColorFilter} onChange={e=>setActiveLiningColorFilter(e.target.value)} style={{...C.inp,width:240,padding:"7px 10px",fontSize:12,fontWeight:600,borderColor:C.accent,background:C.card,cursor:"pointer"}}>
            <option value="">All Colors ({rows.length})</option>
            {colorOptions.map(v=><option key={v} value={v}>{v==="__missing__"?"Missing Color":v} ({countColor(v)})</option>)}
          </select>
        </label>
        {activeLiningColorFilter&&<button onClick={()=>setActiveLiningColorFilter("")}
          style={{background:"none",border:`1px solid ${C.border}`,color:C.sub,borderRadius:0,padding:"6px 12px",cursor:"pointer",fontSize:12}}>Clear</button>}
      </div>;
    })()}

    {/* ── Farma: fixed Farma Code dropdown filter ── */}
    {!loading&&modId==="farma"&&(()=>{
      const countFarma=f=>rows.filter(r=>upperRowMatchesFarma(r,f.value)).length;
      return <div style={{display:"flex",gap:12,padding:"8px 16px",borderBottom:`1px solid ${C.border}`,
        background:"#FFFFF8",flexShrink:0,alignItems:"center",flexWrap:"wrap"}}>
        <span style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em",flexShrink:0}}>Quick:</span>
        <label style={{display:"flex",alignItems:"center",gap:7}}>
          <span style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em"}}>Farma</span>
          <select value={activeFarmaCodeFilter} onChange={e=>setActiveFarmaCodeFilter(e.target.value)} style={{...C.inp,width:250,padding:"7px 10px",fontSize:12,fontWeight:600,borderColor:C.accent,background:C.card,cursor:"pointer"}}>
            <option value="">All Farma ({rows.length})</option>
            {HANDSOLE_FARMA_OPTIONS.map(f=><option key={f.value} value={f.value}>{f.label} ({countFarma(f)})</option>)}
          </select>
        </label>
        {activeFarmaCodeFilter&&<button onClick={()=>setActiveFarmaCodeFilter("")}
          style={{background:"none",border:`1px solid ${C.border}`,color:C.sub,borderRadius:0,padding:"6px 12px",cursor:"pointer",fontSize:12}}>Clear</button>}
      </div>;
    })()}

    {/* ── Upper Leather: Type / Pattern + Color dropdown filters ── */}
    {!loading&&modId==="upper_leather"&&(()=>{
      const splitVals=(key)=>Array.from(new Set(rows.flatMap(r=>String(r[key]||"").split(",").map(s=>s.trim()).filter(Boolean)))).filter(v=>!isNoisyQuickValue(v)).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
      const patternOptions=splitVals("type_pattern");
      const usedColors=Array.from(new Set(rows.map(r=>inferLeatherColor(r)).filter(Boolean)));
      const colorOptions=[...usedColors.sort((a,b)=>a.localeCompare(b,undefined,{numeric:true})), "__missing__"];
      const countPattern=v=>rows.filter(r=>String(r.type_pattern||"").toLowerCase().split(",").map(s=>s.trim()).includes(String(v).toLowerCase())).length;
      const countColor=v=>v==="__missing__"?rows.filter(r=>!inferLeatherColor(r)).length:rows.filter(r=>leatherColorMatches(r,v)).length;
      return <div style={{display:"flex",gap:12,padding:"8px 16px",borderBottom:`1px solid ${C.border}`,
        background:"#FFFFF8",flexShrink:0,alignItems:"center",flexWrap:"wrap"}}>
        <span style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em",flexShrink:0}}>Quick:</span>
        <label style={{display:"flex",alignItems:"center",gap:7}}>
          <span style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em"}}>Type / Pattern</span>
          <select value={activeUpperLeatherTypeFilter} onChange={e=>setActiveUpperLeatherTypeFilter(e.target.value)} style={{...C.inp,width:260,padding:"7px 10px",fontSize:12,fontWeight:600,borderColor:C.accent,background:C.card,cursor:"pointer"}}>
            <option value="">All Type / Pattern ({rows.length})</option>
            {patternOptions.map(v=><option key={v} value={v}>{v} ({countPattern(v)})</option>)}
          </select>
        </label>
        <label style={{display:"flex",alignItems:"center",gap:7}}>
          <span style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em"}}>Color</span>
          <select value={activeUpperLeatherColorFilter} onChange={e=>setActiveUpperLeatherColorFilter(e.target.value)} style={{...C.inp,width:220,padding:"7px 10px",fontSize:12,fontWeight:600,borderColor:C.accent,background:C.card,cursor:"pointer"}}>
            <option value="">All Colors ({rows.length})</option>
            {colorOptions.map(v=><option key={v} value={v}>{v==="__missing__"?"Missing Color":v} ({countColor(v)})</option>)}
          </select>
        </label>
        {(activeUpperLeatherTypeFilter||activeUpperLeatherColorFilter)&&<button onClick={()=>{setActiveUpperLeatherTypeFilter("");setActiveUpperLeatherColorFilter("");}}
          style={{background:"none",border:`1px solid ${C.border}`,color:C.sub,borderRadius:0,padding:"6px 12px",cursor:"pointer",fontSize:12}}>Clear</button>}
      </div>;
    })()}

    {/* ── Upper: Style + Size + Farma quick dropdown filters ── */}
    {!loading&&modId==="uppers"&&(()=>{
      const norm=v=>String(v||"").trim();
      const styleOptions=Array.from(new Set(rows.map(r=>norm(r.style)).filter(Boolean))).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
      const sizeOptions=SHOE_SIZES.filter(s=>rows.some(r=>norm(r.size)===String(s)));
      const extraSizes=Array.from(new Set(rows.map(r=>norm(r.size)).filter(Boolean).filter(s=>!SHOE_SIZES.includes(s)))).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
      const allSizeOptions=[...sizeOptions,...extraSizes];
      const farmaValues=HANDSOLE_FARMA_OPTIONS;
      const styleCount=st=>rows.filter(r=>norm(r.style).toLowerCase()===String(st).toLowerCase()).length;
      const sizeCount=sz=>rows.filter(r=>norm(r.size)===String(sz)).length;
      const farmaCount=f=>rows.filter(r=>upperRowMatchesFarma(r,f.value)).length;
      return <div style={{display:"flex",gap:12,padding:"8px 16px",borderBottom:`1px solid ${C.border}`,
        background:"#FFFFF8",flexShrink:0,alignItems:"center",flexWrap:"wrap"}}>
        <span style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em",flexShrink:0}}>Quick:</span>
        <label style={{display:"flex",alignItems:"center",gap:7}}>
          <span style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em"}}>Style</span>
          <select value={activeUpperStyleFilter} onChange={e=>setActiveUpperStyleFilter(e.target.value)} style={{...C.inp,width:210,padding:"7px 10px",fontSize:12,fontWeight:600,borderColor:C.accent,background:C.card,cursor:"pointer"}}>
            <option value="">All styles ({rows.length})</option>
            {styleOptions.map(st=><option key={st} value={st}>{st} ({styleCount(st)})</option>)}
          </select>
        </label>
        <label style={{display:"flex",alignItems:"center",gap:7}}>
          <span style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em"}}>Size</span>
          <select value={activeUpperSizeFilter} onChange={e=>setActiveUpperSizeFilter(e.target.value)} style={{...C.inp,width:190,padding:"7px 10px",fontSize:12,fontWeight:600,borderColor:C.accent,background:C.card,cursor:"pointer"}}>
            <option value="">All sizes ({rows.length})</option>
            {allSizeOptions.map(sz=><option key={sz} value={sz}>Size {sz} ({sizeCount(sz)})</option>)}
          </select>
        </label>
        <label style={{display:"flex",alignItems:"center",gap:7}}>
          <span style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em"}}>Farma</span>
          <select value={activeUpperFarmaFilter} onChange={e=>setActiveUpperFarmaFilter(e.target.value)} style={{...C.inp,width:210,padding:"7px 10px",fontSize:12,fontWeight:600,borderColor:C.accent,background:C.card,cursor:"pointer"}}>
            <option value="">All farma ({rows.length})</option>
            {farmaValues.map(f=><option key={f.value} value={f.value}>{f.label} ({farmaCount(f)})</option>)}
          </select>
        </label>
        {(activeUpperStyleFilter||activeUpperSizeFilter||activeUpperFarmaFilter)&&<button onClick={()=>{setActiveUpperStyleFilter("");setActiveUpperSizeFilter("");setActiveUpperFarmaFilter("");}}
          style={{background:"none",border:`1px solid ${C.border}`,color:C.sub,borderRadius:0,padding:"6px 12px",cursor:"pointer",fontSize:12}}>Clear</button>}
      </div>;
    })()}

    {/* ── Pair / Inventory: Finish + Stock quick dropdown filters ── */}
    {!loading&&modId==="inventory"&&(()=>{
      const norm=v=>String(v||"").trim().toLowerCase();
      const finishOptions=PAIR_FINISH_STATUSES;
      const stockOptions=PAIR_STOCK_STATUSES;
      const finishCount=st=>rows.filter(r=>norm(r.finish_status)===st.toLowerCase()).length;
      const stockCount=st=>rows.filter(r=>norm(r.status)===st.toLowerCase()).length;
      return <div style={{display:"flex",gap:12,padding:"8px 16px",borderBottom:`1px solid ${C.border}`,
        background:"#FFFFF8",flexShrink:0,alignItems:"center",flexWrap:"wrap"}}>
        <span style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em",flexShrink:0}}>Quick:</span>
        <label style={{display:"flex",alignItems:"center",gap:7}}>
          <span style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em"}}>Finish</span>
          <select value={activeInventoryFinishFilter} onChange={e=>setActiveInventoryFinishFilter(e.target.value)} style={{...C.inp,width:230,padding:"7px 10px",fontSize:12,fontWeight:600,borderColor:C.accent,background:C.card,cursor:"pointer"}}>
            <option value="">All Finish Status ({rows.length})</option>
            {finishOptions.map(st=><option key={st} value={st}>{st} ({finishCount(st)})</option>)}
          </select>
        </label>
        <label style={{display:"flex",alignItems:"center",gap:7}}>
          <span style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em"}}>Stock</span>
          <select value={activeInventoryStockFilter} onChange={e=>setActiveInventoryStockFilter(e.target.value)} style={{...C.inp,width:220,padding:"7px 10px",fontSize:12,fontWeight:600,borderColor:C.accent,background:C.card,cursor:"pointer"}}>
            <option value="">All Stock Status ({rows.length})</option>
            {stockOptions.map(st=><option key={st} value={st}>{st} ({stockCount(st)})</option>)}
          </select>
        </label>
        {(activeInventoryFinishFilter||activeInventoryStockFilter)&&<button onClick={()=>{setActiveInventoryFinishFilter("");setActiveInventoryStockFilter("");}}
          style={{background:"none",border:`1px solid ${C.border}`,color:C.sub,borderRadius:0,padding:"6px 12px",cursor:"pointer",fontSize:12}}>Clear</button>}
      </div>;
    })()}

    {/* ── Leather / Rubber Sole: separate Size and Farma quick filters ── */}
    {!loading&&["laser_sole","rubber_laser"].includes(modId)&&(()=>{
      const allSizes=SHOE_SIZES.filter(s=>/^\d+(?:\.5)?$/.test(String(s)));
      const countSize=size=>rows.filter(r=>String(r.size||"").trim()===String(size)).length;
      const missingSize=rows.filter(r=>!present(r.size)).length;
      const farmaOptions=farmaFilterOptions.length?farmaFilterOptions:[1,2,3,4,5,6,7,8].map(n=>({value:String(n),label:`Farma ${n}`}));
      const rowMatchesFarma=(r,farma)=>String(r.farma_id||"").trim()===String(farma)||String(r.farma_option||"").trim()===String(farma);
      const countFarma=farma=>rows.filter(r=>rowMatchesFarma(r,farma)).length;
      return <div style={{display:"flex",gap:12,padding:"8px 16px",borderBottom:`1px solid ${C.border}`,
        background:"#FFFFF8",flexShrink:0,alignItems:"center",flexWrap:"wrap"}}>
        <span style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em",flexShrink:0}}>Quick:</span>
        <label style={{display:"flex",alignItems:"center",gap:7}}>
          <span style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em"}}>Size</span>
          <select value={activeSizeFilter} onChange={e=>setActiveSizeFilter(e.target.value)} style={{...C.inp,width:230,padding:"7px 10px",fontSize:12,fontWeight:600,borderColor:C.accent,background:C.card,cursor:"pointer"}}>
            <option value="">All sizes ({rows.length})</option>
            {allSizes.map(size=><option key={size} value={size}>Size {size} ({countSize(size)})</option>)}
            <option value="__missing__">Missing Size ({missingSize})</option>
          </select>
        </label>
        <label style={{display:"flex",alignItems:"center",gap:7}}>
          <span style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em"}}>Farma</span>
          <select value={activeFarmaFilter} onChange={e=>setActiveFarmaFilter(e.target.value)} style={{...C.inp,width:230,padding:"7px 10px",fontSize:12,fontWeight:600,borderColor:C.accent,background:C.card,cursor:"pointer"}}>
            <option value="">All farma ({rows.length})</option>
            {farmaOptions.map(opt=><option key={opt.value} value={opt.value}>{opt.label} ({countFarma(opt.value)})</option>)}
          </select>
        </label>
        {modId==="laser_sole"&&<label style={{display:"flex",alignItems:"center",gap:7}}>
          <span style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em"}}>Thickness</span>
          <select value={activeSoleThicknessFilter} onChange={e=>setActiveSoleThicknessFilter(e.target.value)} style={{...C.inp,width:190,padding:"7px 10px",fontSize:12,fontWeight:600,borderColor:C.accent,background:C.card,cursor:"pointer"}}>
            <option value="">All Thickness ({rows.length})</option>
            {SOLE_THICKNESS_OPTIONS.map(v=><option key={v} value={v}>{v} ({rows.filter(r=>String(r.thickness||"").trim().toLowerCase()===v.toLowerCase()).length})</option>)}
          </select>
        </label>}
        {modId==="laser_sole"&&<label style={{display:"flex",alignItems:"center",gap:7}}>
          <span style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em"}}>Type</span>
          <select value={activeSoleTypeFilter} onChange={e=>setActiveSoleTypeFilter(e.target.value)} style={{...C.inp,width:180,padding:"7px 10px",fontSize:12,fontWeight:600,borderColor:C.accent,background:C.card,cursor:"pointer"}}>
            <option value="">All Types ({rows.length})</option>
            {SOLE_DESIGN_TYPE_OPTIONS.map(v=><option key={v} value={v}>{v} ({rows.filter(r=>String(r.type||"").trim().toLowerCase()===v.toLowerCase()).length})</option>)}
          </select>
        </label>}
        {(activeSizeFilter||activeFarmaFilter||activeSoleThicknessFilter||activeSoleTypeFilter)&&<button onClick={()=>{setActiveSizeFilter("");setActiveFarmaFilter("");setActiveSoleThicknessFilter("");setActiveSoleTypeFilter("");}}
          style={{background:"none",border:`1px solid ${C.border}`,color:C.sub,borderRadius:0,padding:"6px 12px",cursor:"pointer",fontSize:12}}>Clear</button>}
      </div>;
    })()}

    {/* ── Customer: Country + Status quick dropdown filters ── */}
    {!loading&&modId==="customers"&&(()=>{
      const countryCount=kind=>rows.filter(r=>{
        const c=String(r.country||"").trim().toLowerCase();
        if(kind==="pakistan")return c==="pakistan";
        if(kind==="rest")return c!=="pakistan";
        return true;
      }).length;
      const statuses=["Pending","Processing","Shipped","In Transit","Delivered","Returned"];
      const normStatus=v=>String(v||"").trim().toLowerCase();
      const statusCount=st=>rows.filter(r=>normStatus(r.delivery_status)===st.toLowerCase()).length;
      return <div style={{display:"flex",gap:12,padding:"8px 16px",borderBottom:`1px solid ${C.border}`,
        background:"#FFFFF8",flexShrink:0,alignItems:"center",flexWrap:"wrap"}}>
        <span style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em",flexShrink:0}}>Quick:</span>
        <label style={{display:"flex",alignItems:"center",gap:7}}>
          <span style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em"}}>Country</span>
          <select value={activeCustomerCountryFilter} onChange={e=>setActiveCustomerCountryFilter(e.target.value)} style={{...C.inp,width:210,padding:"7px 10px",fontSize:12,fontWeight:600,borderColor:C.accent,background:C.card,cursor:"pointer"}}>
            <option value="">All countries ({rows.length})</option>
            <option value="pakistan">Pakistan ({countryCount("pakistan")})</option>
            <option value="rest">Rest of World ({countryCount("rest")})</option>
          </select>
        </label>
        <label style={{display:"flex",alignItems:"center",gap:7}}>
          <span style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em"}}>Status</span>
          <select value={activeCustomerStatusFilter} onChange={e=>setActiveCustomerStatusFilter(e.target.value)} style={{...C.inp,width:220,padding:"7px 10px",fontSize:12,fontWeight:600,borderColor:C.accent,background:C.card,cursor:"pointer"}}>
            <option value="">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Processing">Processing</option>
            <option value="Shipped">Shipped</option>
            <option value="In Transit">In Transit</option>
            <option value="Delivered">Delivered</option>
            <option value="Returned">Returned</option>
          </select>
        </label>
        <label style={{display:"flex",alignItems:"center",gap:7}}>
          <span style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em"}}>Size</span>
          <select value={activeCustomerSizeModeFilter} onChange={e=>setActiveCustomerSizeModeFilter(e.target.value)} style={{...C.inp,width:230,padding:"7px 10px",fontSize:12,fontWeight:600,borderColor:C.accent,background:C.card,cursor:"pointer"}}>
            <option value="">All Size Types</option>
            <option value="Generic Size">Generic Size</option>
            <option value="Provided Measurement">Provided Measurement</option>
          </select>
        </label>
        {(activeCustomerCountryFilter||activeCustomerStatusFilter||activeCustomerSizeModeFilter)&&<button onClick={()=>{setActiveCustomerCountryFilter("");setActiveCustomerStatusFilter("");setActiveCustomerSizeModeFilter("");}}
          style={{background:"none",border:`1px solid ${C.border}`,color:C.sub,borderRadius:0,padding:"6px 12px",cursor:"pointer",fontSize:12}}>Clear</button>}
      </div>;
    })()}

    {/* ── Customer Measurement: only Size Type quick dropdown filter ── */}
    {!loading&&modId==="measurements"&&(()=>{
      const hasPoints=r=>[r.point_a,r.point_b,r.point_c,r.point_d,r.point_e,r.point_f].some(present);
      const sizeMode=r=>String(r.customer_size_mode||r.customer_size_type||(hasPoints(r)||String(r.size||"").toLowerCase().includes("measurement")?"Provided Measurement":present(r.size)?"Generic Size":"")).trim();
      const countMode=mode=>rows.filter(r=>sizeMode(r)===mode).length;
      return <div style={{display:"flex",gap:12,padding:"8px 16px",borderBottom:`1px solid ${C.border}`,
        background:"#FFFFF8",flexShrink:0,alignItems:"center",flexWrap:"wrap"}}>
        <span style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em",flexShrink:0}}>Quick:</span>
        <label style={{display:"flex",alignItems:"center",gap:7}}>
          <span style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em"}}>Size Type</span>
          <select value={activeMeasurementSizeModeFilter} onChange={e=>setActiveMeasurementSizeModeFilter(e.target.value)} style={{...C.inp,width:260,padding:"7px 10px",fontSize:12,fontWeight:600,borderColor:C.accent,background:C.card,cursor:"pointer"}}>
            <option value="">All Size Types ({rows.length})</option>
            <option value="Generic Size">Generic Size ({countMode("Generic Size")})</option>
            <option value="Provided Measurement">Provided Measurement ({countMode("Provided Measurement")})</option>
          </select>
        </label>
        {activeMeasurementSizeModeFilter&&<button onClick={()=>setActiveMeasurementSizeModeFilter("")}
          style={{background:"none",border:`1px solid ${C.border}`,color:C.sub,borderRadius:0,padding:"6px 12px",cursor:"pointer",fontSize:12}}>Clear</button>}
      </div>;
    })()}

    {/* ── Quick Filter — compact dropdowns for focused tables, chips for other tables ── */}
    {quickChips.length>0&&!loading&&["extra_saman","videos","inspiration","faults","patterns","sops","heel_tops","buckles"].includes(modId)&&(
      <div style={{display:"flex",gap:8,padding:"8px 16px",borderBottom:`1px solid ${C.border}`,
        background:"#FFFFF8",flexShrink:0,alignItems:"center",flexWrap:"wrap"}}>
        <span style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",
          letterSpacing:"0.08em",flexShrink:0}}>Quick:</span>
        <select value={activeChip?.id||"all"} onChange={e=>{
          const chip=quickChips.find(c=>c.id===e.target.value);
          setActiveChip(!chip||chip.id==="all"?null:chip);
        }} style={{...C.inp,width:modId==="inspiration"?360:(modId==="patterns"?320:(modId==="upper_leather"?320:(modId==="videos"?300:(["laser_sole","rubber_laser"].includes(modId)?300:260)))),padding:"7px 10px",fontSize:12,fontWeight:600,
          borderColor:C.accent,background:C.card,cursor:"pointer"}}>
          {quickChips.map(chip=><option key={chip.id} value={chip.id}>
            {chip.label} ({chip.count})
          </option>)}
        </select>
        {activeChip&&<button onClick={()=>setActiveChip(null)}
          style={{background:"none",border:`1px solid ${C.border}`,color:C.sub,borderRadius:0,
            padding:"6px 12px",cursor:"pointer",fontSize:12}}>Clear</button>}
      </div>
    )}

    {false&&!loading&&modId==="knowledge"&&(()=>{
      const current=filterRules.find(r=>r.col==="knowledge_category")?.val||"";
      const missingActive=filterRules.some(r=>r.col==="knowledge_category"&&r.cond==="is empty");
      const options=getFilterOptions("knowledge","knowledge_category",rows);
      const setCategory=v=>{
        setActiveChip(null);
        if(!v)setFilterRules([]);
        else if(v==="__missing__")setFilterRules([{col:"knowledge_category",cond:"is empty",val:""}]);
        else setFilterRules([{col:"knowledge_category",cond:"equals",val:v}]);
      };
      return <div style={{display:"flex",gap:10,padding:"8px 16px",borderBottom:`1px solid ${C.border}`,
        background:"#FFFFF8",flexShrink:0,alignItems:"center",flexWrap:"wrap"}}>
        <span style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.08em",flexShrink:0}}>Category Filter:</span>
        <select value={missingActive?"__missing__":current} onChange={e=>setCategory(e.target.value)}
          style={{...C.inp,width:320,padding:"7px 10px",fontSize:12,fontWeight:600,borderColor:C.accent,background:C.card,cursor:"pointer"}}>
          <option value="">All categories ({rows.length})</option>
          {options.map(o=>{
            const count=rows.filter(r=>String(r.knowledge_category||"").trim()===o).length;
            return <option key={o} value={o}>{o} ({count})</option>;
          })}
          <option value="__missing__">Missing Category ({rows.filter(r=>!present(r.knowledge_category)).length})</option>
        </select>
        {(current||missingActive)&&<button onClick={()=>setCategory("")}
          style={{background:"none",border:`1px solid ${C.border}`,color:C.sub,borderRadius:0,padding:"6px 12px",cursor:"pointer",fontSize:12}}>Clear</button>}
      </div>;
    })()}

    {quickChips.length>0&&!loading&&!["extra_saman","videos","inspiration","faults","patterns","sops","heel_tops","buckles","laser_sole","rubber_laser","customers","inventory"].includes(modId)&&(
      <div style={{display:"flex",gap:6,padding:"8px 16px",borderBottom:`1px solid ${C.border}`,
        background:"#FFFFF8",flexShrink:0,flexWrap:"wrap",alignItems:"center"}}>
        <span style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",
          letterSpacing:"0.08em",marginRight:4,flexShrink:0}}>Quick:</span>
        {activeChip&&<button onClick={()=>setActiveChip(null)}
          style={{display:"flex",alignItems:"center",gap:4,padding:"4px 10px",
            background:"#FEF2F2",border:"1px solid #FCA5A5",color:"#DC2626",
            borderRadius:0,fontSize:11,fontWeight:600,cursor:"pointer"}}>
          <i className="ti ti-x" style={{fontSize:10}}/> Clear filter
        </button>}
        {quickChips.map((chip,i)=>{
          const isActive=activeChip?.id?activeChip.id===chip.id:(activeChip?.col===chip.col&&activeChip?.val===chip.val);
          const bc=badge(chip.label||chip.displayVal||chip.val);
          return <button key={i} onClick={()=>setActiveChip(isActive?null:chip)}
            style={{display:"flex",alignItems:"center",gap:5,padding:"4px 11px",
              background:isActive?C.accent:bc.bg,
              border:`1px solid ${isActive?C.accent:C.border}`,
              color:isActive?"#111":bc.c,borderRadius:0,
              fontSize:11,fontWeight:isActive?700:500,cursor:"pointer",
              transition:"all 0.12s",whiteSpace:"nowrap"}}>
            {chip.label||chip.displayVal||chip.val}
            <span style={{background:isActive?"rgba(0,0,0,0.15)":"rgba(0,0,0,0.08)",
              borderRadius:0,padding:"0 5px",fontSize:10,fontWeight:700,
              color:isActive?"#111":C.sub}}>{chip.count}</span>
          </button>;
        })}
      </div>
    )}

    {/* ── Toolbar ── */}
    <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 16px",
      borderBottom:`1px solid ${C.border}`,flexShrink:0,flexWrap:"wrap",rowGap:6,
      background:"#FEFEFE",borderBottom:`1px solid ${C.border}`,position:"sticky",top:0,zIndex:3,boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
      <div style={{flex:"1 1 200px",display:"flex",alignItems:"center",gap:8,
        background:C.card2,border:`1px solid ${C.border}`,borderRadius:0,padding:"7px 11px"}}>
        <i className="ti ti-search" style={{fontSize:13,color:C.dim,flexShrink:0}}/>
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search records…"
          style={{border:"none",outline:"none",background:"transparent",color:C.text,fontSize:13,width:"100%"}}/>
        {q&&<button onClick={()=>setQ("")} style={{background:"none",border:"none",color:C.dim,cursor:"pointer",padding:0,lineHeight:1}}><i className="ti ti-x" style={{fontSize:12}}/></button>}
      </div>

      {/* View mode — table stays default, card/tile is optional */}
      <div style={{display:"flex",background:C.card2,border:`1px solid ${C.border}`,borderRadius:0,overflow:"hidden"}}>
        <button onClick={()=>setViewMode("table")} title="Table view"
          style={{padding:"7px 10px",background:viewMode==="table"?C.accentD:"transparent",
            border:"none",cursor:"pointer",color:viewMode==="table"?C.accent:C.dim,display:"flex",alignItems:"center",gap:5,fontSize:12,fontWeight:viewMode==="table"?700:500}}>
          <i className="ti ti-table" style={{fontSize:13}}/> Table
        </button>
        <button onClick={()=>setViewMode("cards")} title="Card / tile view"
          style={{padding:"7px 10px",background:viewMode==="cards"?C.accentD:"transparent",
            border:"none",borderLeft:`1px solid ${C.border}`,cursor:"pointer",color:viewMode==="cards"?C.accent:C.dim,display:"flex",alignItems:"center",gap:5,fontSize:12,fontWeight:viewMode==="cards"?700:500}}>
          <i className="ti ti-layout-grid" style={{fontSize:13}}/> Cards
        </button>
      </div>

      {/* Density */}
      <div style={{display:"flex",background:C.card2,border:`1px solid ${C.border}`,borderRadius:0,overflow:"hidden"}}>
        {["compact","cozy","comfortable"].map((d,i)=>(
          <button key={d} onClick={()=>setDensity(d)} title={d}
            style={{padding:"7px 9px",background:density===d?C.accentD:"transparent",
              border:"none",borderLeft:i>0?`1px solid ${C.border}`:"none",
              cursor:"pointer",color:density===d?C.accent:C.dim}}>
            <i className={`ti ti-layout-${d==="compact"?"rows":d==="cozy"?"list":"distribute-vertical"}`} style={{fontSize:13}}/>
          </button>
        ))}
      </div>

      {/* Columns */}
      <div ref={colMenuRef} style={{position:"relative"}}>
        <button onClick={()=>setColMenu(o=>!o)}
          style={{display:"flex",alignItems:"center",gap:5,
            background:colMenu?C.accentD:C.card2,
            border:`1px solid ${colMenu?C.accent:C.border}`,
            borderRadius:0,padding:"7px 12px",cursor:"pointer",
            color:colMenu?C.accent:C.sub,fontSize:12}}>
          <i className="ti ti-columns" style={{fontSize:13}}/> Columns
          {hidden.size>0&&<span style={{background:C.accent,color:"#111",borderRadius:0,
            padding:"0 5px",fontSize:10,fontWeight:700}}>{allCols.length-hidden.size}/{allCols.length}</span>}
        </button>
        {colMenu&&<div style={{position:"absolute",top:"calc(100% + 4px)",right:0,
          background:C.card,border:`1px solid ${C.borderL}`,borderRadius:0,
          zIndex:100,minWidth:200,padding:8,boxShadow:"0 4px 20px rgba(0,0,0,0.10)"}}>
          <p style={{color:C.sub,fontSize:10,fontWeight:700,textTransform:"uppercase",
            letterSpacing:"0.07em",margin:"0 0 6px 4px"}}>Show / Hide</p>
          {allCols.map(c=>(
            <label key={c.k} style={{display:"flex",alignItems:"center",gap:8,
              padding:"5px 4px",cursor:"pointer",borderRadius:0}}
              onMouseEnter={e=>e.currentTarget.style.background=C.card2}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <input type="checkbox" checked={!hidden.has(c.k)}
                onChange={()=>{const n=new Set(hidden);n.has(c.k)?n.delete(c.k):n.add(c.k);setHidden(n);}}
                style={{accentColor:C.accent}}/>
              <span style={{color:C.text,fontSize:12}}>{c.t==="img"?"Photo":c.l}</span>
            </label>
          ))}
          {hidden.size>0&&<button onClick={()=>setHidden(new Set())}
            style={{marginTop:6,width:"100%",background:"none",
              border:`1px solid ${C.border}`,color:C.sub,borderRadius:0,
              padding:"5px",cursor:"pointer",fontSize:11}}>Reset</button>}
        </div>}
      </div>

      {/* Advanced Filters removed: compact quick dropdowns + search are used instead. */}

      <button onClick={exportCSV}
        style={{display:"flex",alignItems:"center",gap:5,background:C.card2,
          border:`1px solid ${C.border}`,borderRadius:0,padding:"7px 12px",
          cursor:"pointer",color:C.sub,fontSize:12}} title="Export CSV">
        <i className="ti ti-download" style={{fontSize:13}}/>{selected.size>0?`Export ${selected.size}`:"Export"}
      </button>

    </div>

    {/* ── Active filter chips ── */}
    {(activeFilters.length>0||activeChip||activeSizeFilter||activeFarmaFilter||activeMeasurementSizeModeFilter||activeInventoryFinishFilter||activeInventoryStockFilter)&&(
      <div style={{display:"flex",gap:6,padding:"7px 16px",
        background:"rgba(240,180,41,0.04)",borderBottom:`1px solid ${C.border}`,
        flexShrink:0,flexWrap:"wrap",alignItems:"center"}}>
        <span style={{color:C.sub,fontSize:11,fontWeight:600}}>Active:</span>
        {activeChip&&<span style={{display:"flex",alignItems:"center",gap:5,
          background:C.accentD,border:`1px solid ${C.accent}`,borderRadius:0,
          padding:"3px 10px",fontSize:11,color:C.text}}>
          <span style={{color:C.sub,fontSize:10}}>quick:</span>
          <span style={{fontWeight:600}}>{activeChip.label||activeChip.displayVal||activeChip.val}</span>
          <button onClick={()=>setActiveChip(null)} style={{background:"none",border:"none",color:C.dim,cursor:"pointer",padding:0,lineHeight:1}}><i className="ti ti-x" style={{fontSize:10}}/></button>
        </span>}
        {activeSizeFilter&&<span style={{display:"flex",alignItems:"center",gap:5,
          background:C.accentD,border:`1px solid ${C.accent}`,borderRadius:0,
          padding:"3px 10px",fontSize:11,color:C.text}}>
          <span style={{color:C.sub,fontSize:10}}>size:</span>
          <span style={{fontWeight:600}}>{activeSizeFilter==="__missing__"?"Missing Size":`Size ${activeSizeFilter}`}</span>
          <button onClick={()=>setActiveSizeFilter("")} style={{background:"none",border:"none",color:C.dim,cursor:"pointer",padding:0,lineHeight:1}}><i className="ti ti-x" style={{fontSize:10}}/></button>
        </span>}
        {activeFarmaFilter&&<span style={{display:"flex",alignItems:"center",gap:5,
          background:C.accentD,border:`1px solid ${C.accent}`,borderRadius:0,
          padding:"3px 10px",fontSize:11,color:C.text}}>
          <span style={{color:C.sub,fontSize:10}}>farma:</span>
          <span style={{fontWeight:600}}>{`Farma ${activeFarmaFilter}`}</span>
          <button onClick={()=>setActiveFarmaFilter("")} style={{background:"none",border:"none",color:C.dim,cursor:"pointer",padding:0,lineHeight:1}}><i className="ti ti-x" style={{fontSize:10}}/></button>
        </span>}
        {activeInventoryFinishFilter&&<span style={{display:"flex",alignItems:"center",gap:5,
          background:C.accentD,border:`1px solid ${C.accent}`,padding:"3px 8px",fontSize:11,color:C.text}}>
          <span style={{fontSize:9,color:C.dim,textTransform:"uppercase",fontWeight:700}}>Finish</span>
          <span style={{fontWeight:600}}>{activeInventoryFinishFilter}</span>
        </span>}
        {activeInventoryStockFilter&&<span style={{display:"flex",alignItems:"center",gap:5,
          background:C.accentD,border:`1px solid ${C.accent}`,padding:"3px 8px",fontSize:11,color:C.text}}>
          <span style={{fontSize:9,color:C.dim,textTransform:"uppercase",fontWeight:700}}>Stock</span>
          <span style={{fontWeight:600}}>{activeInventoryStockFilter}</span>
        </span>}
        {activeMeasurementSizeModeFilter&&<span style={{display:"flex",alignItems:"center",gap:5,
          background:C.accentD,border:`1px solid ${C.accent}`,borderRadius:0,
          padding:"3px 10px",fontSize:11,color:C.text}}>
          <span style={{color:C.sub,fontSize:10}}>size type:</span>
          <span style={{fontWeight:600}}>{activeMeasurementSizeModeFilter}</span>
          <button onClick={()=>setActiveMeasurementSizeModeFilter("")} style={{background:"none",border:"none",color:C.dim,cursor:"pointer",padding:0,lineHeight:1}}><i className="ti ti-x" style={{fontSize:10}}/></button>
        </span>}
        {activeFilters.map((f,i)=>{
          const col=filterCols.find(c=>c.k===f.col)||allCols.find(c=>c.k===f.col);
          return <span key={i} style={{display:"flex",alignItems:"center",gap:5,
            background:C.accentD,border:`1px solid ${C.accent}`,borderRadius:0,
            padding:"3px 10px",fontSize:11,color:C.text}}>
            <span style={{color:C.sub,fontWeight:600}}>{col?.l||f.col}</span>
            <span style={{color:C.dim}}>{f.cond}</span>
            {f.val&&<span style={{color:"#92400E",fontWeight:600}}>"{f.val}"</span>}
            <button onClick={()=>setFilterRules(r=>r.filter((_,j)=>j!==i))}
              style={{background:"none",border:"none",color:C.dim,cursor:"pointer",padding:0,lineHeight:1}}>
              <i className="ti ti-x" style={{fontSize:10}}/></button>
          </span>;
        })}
        <button onClick={()=>{setFilterRules([]);setActiveChip(null);}}
          style={{background:"none",border:`1px solid ${C.border}`,color:C.sub,
            borderRadius:0,padding:"3px 10px",cursor:"pointer",fontSize:11}}>
          Clear all
        </button>
      </div>
    )}

    {/* ── Filter Panel removed globally because the generic builder was not useful. ── */}

    {/* ── Bulk action bar ── */}
    {selected.size>0&&(
      <div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 16px",
        background:"#FFFBEB",borderBottom:`2px solid ${C.accent}`,flexShrink:0}}>
        <i className="ti ti-checkbox" style={{fontSize:14,color:C.accent}}/>
        <span style={{color:"#92400E",fontSize:13,fontWeight:600}}>
          {selected.size} row{selected.size!==1?"s":""} selected
        </span>
        <div style={{flex:1}}/>
        <button onClick={async()=>{const ok=await onDelete([...selected]);if(ok)setSelected(new Set());}}
          style={{display:"flex",alignItems:"center",gap:5,background:"#FEF2F2",
            border:`1px solid #FCA5A5`,color:"#DC2626",borderRadius:0,
            padding:"5px 12px",cursor:"pointer",fontSize:12,fontWeight:600}}>
          <i className="ti ti-trash" style={{fontSize:12}}/> Delete selected
        </button>
        <button onClick={()=>setSelected(new Set())}
          style={{display:"flex",alignItems:"center",gap:5,background:"none",
            border:`1px solid ${C.border}`,color:C.dim,borderRadius:0,
            padding:"5px 12px",cursor:"pointer",fontSize:12}}>
          <i className="ti ti-x" style={{fontSize:12}}/> Clear
        </button>
      </div>
    )}

    {/* ── Table ── */}
    {loading?(
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:10}}>
        <i className="ti ti-loader-2 ti-spin" style={{fontSize:28,color:C.accent}}/>
        <span style={{color:C.sub,fontSize:13}}>Loading…</span>
      </div>
    ):filtered.length===0?(
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12}}>
        <div style={{width:60,height:60,borderRadius:0,background:C.card2,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <i className="ti ti-inbox" style={{fontSize:28,color:C.dim}}/>
        </div>
        <p style={{color:C.sub,fontSize:14,fontWeight:500,margin:0}}>
          {hasFilters?"No records match your filters":"No records yet"}
        </p>
        {hasFilters&&<button onClick={()=>{setQ("");setFilterRules([]);setActiveChip(null);}}
          style={{background:C.accentD,border:`1px solid ${C.accent}`,color:C.accent,
            borderRadius:0,padding:"7px 16px",cursor:"pointer",fontSize:12,fontWeight:600}}>
          Clear all filters
        </button>}
        {!hasFilters&&<button onClick={onAdd}
          style={{background:C.accentD,border:`1px solid ${C.accentD}`,color:C.accent,
            borderRadius:0,padding:"8px 18px",cursor:"pointer",fontSize:13}}>
          + Add first record
        </button>}
      </div>
    ):viewMode==="cards"?(
      <div style={{flex:1,overflowY:"auto",padding:16,background:C.bg,boxShadow:"inset 0 1px 0 rgba(0,0,0,0.04)"}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:14}}>
          {pageRows.map((row,i)=>{
            const img=cardImageFor(row);
            const status=cardStatusFor(row);
            const isSel=selected.has(row.id);
            const number=cardNumberFor(row,i);
            const title=cardTitleFor(row);
            return <div key={row.id||i}
              onClick={()=>onEdit(row)}
              style={{background:isSel?"#FFF0C0":C.card,border:`1px solid ${isSel?C.accent:C.border}`,
                boxShadow:"0 1px 4px rgba(0,0,0,0.04)",cursor:"pointer",minHeight:250,display:"flex",flexDirection:"column"}}>
              <div style={{height:132,background:C.card2,borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",position:"relative"}}>
                {img?<img src={img} alt="" style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>:<i className="ti ti-photo" style={{fontSize:30,color:C.dim}}/>}
                <div onClick={e=>e.stopPropagation()} style={{position:"absolute",top:8,left:8}}>
                  <input type="checkbox" checked={isSel} onChange={()=>toggleRow(row.id)} style={{accentColor:C.accent,cursor:"pointer"}}/>
                </div>
                <span style={{position:"absolute",top:8,right:8,background:"rgba(255,255,255,.92)",border:`1px solid ${C.border}`,padding:"2px 7px",fontFamily:C.mono,fontSize:11,fontWeight:800,color:C.text}}>
                  {number||"—"}
                </span>
              </div>
              <div style={{padding:12,display:"flex",flexDirection:"column",gap:8,flex:1}}>
                <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:8}}>
                  <h3 style={{margin:0,fontSize:14,lineHeight:1.25,color:C.text,fontWeight:800,overflow:"hidden",textOverflow:"ellipsis",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{title}</h3>
                  {status&&<Badge v={status}/>}
                </div>
                {row.color&&<div style={{display:"flex",alignItems:"center",gap:7,color:C.sub,fontSize:12}}>
                  <span style={{width:13,height:13,border:`1px solid ${C.borderL}`,background:leatherColorHex(row.color),display:"inline-block",flexShrink:0}}/>
                  <span>{row.color}</span>
                </div>}
                <div style={{display:"grid",gridTemplateColumns:"1fr",gap:5,marginTop:2}}>
                  {cardMetaCols.map(c=>{
                    const v=row[c.k];
                    if(v===undefined||v===null||String(v).trim()==="")return null;
                    return <div key={c.k} style={{display:"flex",justifyContent:"space-between",gap:10,fontSize:11,borderTop:`1px solid ${C.border}`,paddingTop:5}}>
                      <span style={{color:C.dim,textTransform:"uppercase",letterSpacing:".06em",fontWeight:800}}>{c.l}</span>
                      <span style={{color:C.sub,fontWeight:600,textAlign:"right",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:120}}>{String(v)}</span>
                    </div>;
                  })}
                </div>
                <div style={{marginTop:"auto",display:"flex",justifyContent:"flex-end",gap:8,paddingTop:8}}>
                  <button onClick={e=>{e.stopPropagation();onEdit(row);}} style={{background:C.card2,border:`1px solid ${C.border}`,color:C.sub,padding:"6px 9px",cursor:"pointer",fontSize:12}}>
                    <i className="ti ti-pencil"/>
                  </button>
                  <button onClick={async e=>{e.stopPropagation();await onDelete(row.id);}} style={{background:C.card2,border:`1px solid ${C.border}`,color:C.dim,padding:"6px 9px",cursor:"pointer",fontSize:12}}>
                    <i className="ti ti-trash"/>
                  </button>
                </div>
              </div>
            </div>;
          })}
        </div>
      </div>
    ):(
      <div style={{flex:1,overflowY:"auto",overflowX:"auto",boxShadow:"inset 0 1px 0 rgba(0,0,0,0.04)"}}>
        <table style={{width:"100%",borderCollapse:"collapse",tableLayout:"auto"}}>
          <thead>
            <tr>
              <th style={{width:38,padding:"0 8px 0 14px",background:"#F2F2F0",
                position:"sticky",top:0,zIndex:2,borderBottom:`2px solid ${C.border}`}}>
                <input type="checkbox" checked={allSel}
                  ref={el=>{if(el)el.indeterminate=someSel&&!allSel;}}
                  onChange={toggleAll} style={{accentColor:C.accent,cursor:"pointer"}}/>
              </th>
              {visibleCols.map(c=>{
                const active=sortK===c.k;
                const hasActiveFilter=activeFilters.some(f=>f.col===c.k)||activeChip?.col===c.k;
                return <th key={c.k} onClick={()=>c.t!=="img"&&doSort(c.k)}
                  style={{textAlign:colAlign(c),padding:"0 12px",
                    color:active?"#92400E":"#444442",fontSize:10,fontWeight:700,
                    letterSpacing:"0.07em",textTransform:"uppercase",
                    borderBottom:`2px solid ${active?C.accent:C.border}`,whiteSpace:"nowrap",
                    minWidth:c.w,height:38,cursor:c.t!=="img"?"pointer":"default",
                    background:active?"#FFF8E8":"#F2F2F0",
                    position:"sticky",top:0,zIndex:2,userSelect:"none",verticalAlign:"middle",
                    transition:"background 0.12s"}}>
                  <div style={{display:"flex",alignItems:"center",gap:4,
                    justifyContent:colAlign(c)==="right"?"flex-end":colAlign(c)==="center"?"center":"flex-start"}}>
                    {c.t==="img"?<i className="ti ti-camera" style={{fontSize:13}}/>:<span>{c.l}</span>}
                    {active&&<i className={`ti ti-sort-${sortD==="asc"?"ascending":"descending"}`}
                      style={{fontSize:11,color:C.accent}}/>}
                    {!active&&c.t!=="img"&&<i className="ti ti-arrows-sort"
                      style={{fontSize:9,color:C.dim,opacity:0.25}}/>}
                    {hasActiveFilter&&<div style={{width:5,height:5,borderRadius:0,
                      background:C.accent,flexShrink:0}}/>}
                  </div>
                </th>;
              })}
              {/* Trend column header */}
              <th style={{width:90,padding:"0 12px",background:"#F2F2F0",position:"sticky",
                top:0,zIndex:2,borderBottom:`2px solid ${C.border}`,textAlign:"left"}}>
                <span style={{fontSize:9,fontWeight:700,letterSpacing:"0.07em",
                  textTransform:"uppercase",color:C.dim}}>TREND</span>
              </th>
              <th style={{width:42,background:"#F2F2F0",position:"sticky",top:0,
                zIndex:2,borderBottom:`2px solid ${C.border}`}}/>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row,i)=>{
              const isSel=selected.has(row.id);
              const isZebra=i%2===1;
              const trend=getTrend(row,rows,allCols,modId);
              return <tr key={row.id||i}
                style={{background:isSel?"#FFF0C0":isZebra?"#F8F8F6":"#FFFFFF",
                  cursor:"pointer",transition:"background 0.08s"}}
                onMouseEnter={e=>{if(!isSel){e.currentTarget.style.background="#FFF4D6";e.currentTarget.style.cursor="pointer";}}}
                onMouseLeave={e=>{if(!isSel)e.currentTarget.style.background=isZebra?"#F8F8F6":"#FFFFFF";}}
                onClick={()=>onEdit(row)}>
                <td style={{padding:"0 8px 0 14px",height:dens.rh,verticalAlign:"middle"}}
                  onClick={e=>e.stopPropagation()}>
                  <input type="checkbox" checked={isSel} onChange={()=>toggleRow(row.id)}
                    style={{accentColor:C.accent,cursor:"pointer"}}/>
                </td>
                {visibleCols.map((c,ci)=>{
                  const align=colAlign(c);const primary=ci===1;const val=row[c.k];
                  return <td key={c.k}
                    style={{padding:dens.pad,height:dens.rh,verticalAlign:"middle",
                      textAlign:align,whiteSpace:"nowrap",maxWidth:c.w+90,
                      overflow:"hidden",textOverflow:"ellipsis",fontSize:dens.fs}}
                    onClick={(c.t==="img"||c.t==="video")?e=>e.stopPropagation():undefined}>
                    {c.t==="pattern_num"?(()=>{
                      const globalIndex=(safePage-1)*pageSize+i;
                      const dynamicPattern=row.number||row.pattern_number||row.pattern_no||row.serial_number||(total-globalIndex);
                      return <span title={row.id?`Database ID: ${row.id}`:""} style={{display:"inline-flex",alignItems:"center",justifyContent:"flex-start",width:"100%",color:C.text,fontFamily:C.mono,fontSize:12,fontWeight:800,whiteSpace:"nowrap",textAlign:"left"}}>{dynamicPattern||"—"}</span>;
                    })()
                    :c.t==="inspiration_num"?(()=>{
                      const globalIndex=(safePage-1)*pageSize+i;
                      const dynamicInspiration=row.inspiration_number||row.reference_number||row.serial_number||(total-globalIndex);
                      return <span title={row.id?`Database ID: ${row.id}`:""} style={{display:"inline-flex",alignItems:"center",justifyContent:"flex-start",width:"100%",color:C.text,fontFamily:C.mono,fontSize:12,fontWeight:800,whiteSpace:"nowrap",textAlign:"left"}}>{dynamicInspiration||"—"}</span>;
                    })()
                    :c.t==="sop_num"?(()=>{
                      const globalIndex=(safePage-1)*pageSize+i;
                      const dynamicSop=row.rule_number||row.sop_number||row.sop_no||row.serial_number||(total-globalIndex);
                      return <span title={row.id?`Database ID: ${row.id}`:""} style={{display:"inline-flex",alignItems:"center",justifyContent:"flex-start",width:"100%",color:C.text,fontFamily:C.mono,fontSize:12,fontWeight:800,whiteSpace:"nowrap",textAlign:"left"}}>{dynamicSop||"—"}</span>;
                    })()
                    :c.t==="rule_num"?(()=>{
                      const globalIndex=(safePage-1)*pageSize+i;
                      const dynamicRule=row.rule_number||row.rule_no||row.serial_number||(total-globalIndex);
                      return <span title={row.id?`Database ID: ${row.id}`:""} style={{display:"inline-flex",alignItems:"center",justifyContent:"flex-start",width:"100%",color:C.text,fontFamily:C.mono,fontSize:12,fontWeight:800,whiteSpace:"nowrap",textAlign:"left"}}>{dynamicRule||"—"}</span>;
                    })()
                    :c.t==="income_num"?(()=>{
                      const globalIndex=(safePage-1)*pageSize+i;
                      const dynamicIncome=row.income_number||row.sale_number||row.serial_number||(total-globalIndex);
                      return <span title={row.id?`Database ID: ${row.id}`:""} style={{display:"inline-flex",alignItems:"center",justifyContent:"flex-start",width:"100%",color:C.text,fontFamily:C.mono,fontSize:12,fontWeight:800,whiteSpace:"nowrap",textAlign:"left"}}>{dynamicIncome||"—"}</span>;
                    })()
                    :c.t==="expense_num"?(()=>{
                      const globalIndex=(safePage-1)*pageSize+i;
                      const dynamicExpense=row.entry_number||row.expense_number||row.serial_number||(total-globalIndex);
                      return <span title={row.id?`Database ID: ${row.id}`:""} style={{display:"inline-flex",alignItems:"center",justifyContent:"flex-start",width:"100%",color:C.text,fontFamily:C.mono,fontSize:12,fontWeight:800,whiteSpace:"nowrap",textAlign:"left"}}>{dynamicExpense||"—"}</span>;
                    })()
                    :c.t==="polish_num"?(()=>{
                      const globalIndex=(safePage-1)*pageSize+i;
                      const dynamicPolish=row.polish_number||row.polish_no||row.serial_number||(total-globalIndex);
                      return <span title={row.id?`Database ID: ${row.id}`:""} style={{display:"inline-flex",alignItems:"center",justifyContent:"flex-start",width:"100%",color:C.text,fontFamily:C.mono,fontSize:12,fontWeight:800,whiteSpace:"nowrap",textAlign:"left"}}>{dynamicPolish||"—"}</span>;
                    })()
                    :c.t==="dye_num"?(()=>{
                      const globalIndex=(safePage-1)*pageSize+i;
                      const dynamicDye=row.dye_number||row.dye_no||row.color_number||row.serial_number||(total-globalIndex);
                      return <span title={row.id?`Database ID: ${row.id}`:""} style={{display:"inline-flex",alignItems:"center",justifyContent:"flex-start",width:"100%",color:C.text,fontFamily:C.mono,fontSize:12,fontWeight:800,whiteSpace:"nowrap",textAlign:"left"}}>{dynamicDye||"—"}</span>;
                    })()
                    :c.t==="mek_num"?(()=>{
                      const globalIndex=(safePage-1)*pageSize+i;
                      const dynamicMek=row.mek_number||row.mek_no||row.sheet_number||row.serial_number||(total-globalIndex);
                      return <span title={row.id?`Database ID: ${row.id}`:""} style={{display:"inline-flex",alignItems:"center",justifyContent:"flex-start",width:"100%",color:C.text,fontFamily:C.mono,fontSize:12,fontWeight:800,whiteSpace:"nowrap",textAlign:"left"}}>{dynamicMek||"—"}</span>;
                    })()
                    :c.t==="leather_board_num"?(()=>{
                      const globalIndex=(safePage-1)*pageSize+i;
                      const dynamicBoard=row.leather_board_number||row.board_number||row.board_no||row.serial_number||(total-globalIndex);
                      return <span title={row.id?`Database ID: ${row.id}`:""} style={{display:"inline-flex",alignItems:"center",justifyContent:"flex-start",width:"100%",color:C.text,fontFamily:C.mono,fontSize:12,fontWeight:800,whiteSpace:"nowrap",textAlign:"left"}}>{dynamicBoard||"—"}</span>;
                    })()
                    :c.t==="tapi_num"?(()=>{
                      const globalIndex=(safePage-1)*pageSize+i;
                      const dynamicTapi=row.tapi_number||row.heel_top_number||row.heel_top_no||row.serial_number||(total-globalIndex);
                      return <span title={row.id?`Database ID: ${row.id}`:""} style={{display:"inline-flex",alignItems:"center",justifyContent:"flex-start",width:"100%",color:C.text,fontFamily:C.mono,fontSize:12,fontWeight:800,whiteSpace:"nowrap",textAlign:"left"}}>{dynamicTapi||"—"}</span>;
                    })()
                    :c.t==="sooti_num"?(()=>{
                      const globalIndex=(safePage-1)*pageSize+i;
                      const dynamicSooti=row.sooti_number||row.sooti_no||row.serial_number||(total-globalIndex);
                      return <span title={row.id?`Database ID: ${row.id}`:""} style={{display:"inline-flex",alignItems:"center",justifyContent:"flex-start",width:"100%",color:C.text,fontFamily:C.mono,fontSize:12,fontWeight:800,whiteSpace:"nowrap",textAlign:"left"}}>{dynamicSooti||"—"}</span>;
                    })()
                    :c.t==="sole_sheet_num"?(()=>{
                      const globalIndex=(safePage-1)*pageSize+i;
                      const dynamicSheet=row.sole_sheet_number||row.sheet_number||row.sheet_no||row.serial_number||(total-globalIndex);
                      return <span title={row.id?`Database ID: ${row.id}`:""} style={{display:"inline-flex",alignItems:"center",justifyContent:"flex-start",width:"100%",color:C.text,fontFamily:C.mono,fontSize:12,fontWeight:800,whiteSpace:"nowrap",textAlign:"left"}}>{dynamicSheet||"—"}</span>;
                    })()
                    :c.t==="heel_num"?(()=>{
                      const globalIndex=(safePage-1)*pageSize+i;
                      const dynamicHeel=row.heel_number||row.heel_no||row.serial_number||(total-globalIndex);
                      return <span title={row.id?`Database ID: ${row.id}`:""} style={{display:"inline-flex",alignItems:"center",justifyContent:"flex-start",width:"100%",color:C.text,fontFamily:C.mono,fontSize:12,fontWeight:800,whiteSpace:"nowrap",textAlign:"left"}}>{dynamicHeel||"—"}</span>;
                    })()
                    :c.t==="rubber_num"?(()=>{
                      const globalIndex=(safePage-1)*pageSize+i;
                      const dynamicRubber=row.rubber_number||row.rubber_no||row.serial_number||(total-globalIndex);
                      return <span title={row.id?`Database ID: ${row.id}`:""} style={{display:"inline-flex",alignItems:"center",justifyContent:"flex-start",width:"100%",color:C.text,fontFamily:C.mono,fontSize:12,fontWeight:800,whiteSpace:"nowrap",textAlign:"left"}}>{dynamicRubber||"—"}</span>;
                    })()
                    :c.t==="sole_num"?(()=>{
                      const globalIndex=(safePage-1)*pageSize+i;
                      const dynamicSole=row.sole_number||row.sole_no||row.serial_number||(total-globalIndex);
                      return <span title={row.id?`Database ID: ${row.id}`:""} style={{display:"inline-flex",alignItems:"center",justifyContent:"flex-start",width:"100%",color:C.text,fontFamily:C.mono,fontSize:12,fontWeight:800,whiteSpace:"nowrap",textAlign:"left"}}>{dynamicSole||"—"}</span>;
                    })()
                    :c.t==="putha_num"?(()=>{
                      const globalIndex=(safePage-1)*pageSize+i;
                      const dynamicPutha=row.putha_number||row.putha_no||row.serial_number||(total-globalIndex);
                      return <span title={row.id?`Database ID: ${row.id}`:""} style={{display:"inline-flex",alignItems:"center",justifyContent:"flex-start",width:"100%",color:C.text,fontFamily:C.mono,fontSize:12,fontWeight:800,whiteSpace:"nowrap",textAlign:"left"}}>{dynamicPutha||"—"}</span>;
                    })()
                    :c.t==="thread_num"?(()=>{
                      const globalIndex=(safePage-1)*pageSize+i;
                      const dynamicThread=row.thread_number||row.thread_no||row.serial_number||(total-globalIndex);
                      return <span title={row.id?`Database ID: ${row.id}`:""} style={{display:"inline-flex",alignItems:"center",justifyContent:"flex-start",width:"100%",color:C.text,fontFamily:C.mono,fontSize:12,fontWeight:800,whiteSpace:"nowrap",textAlign:"left"}}>{dynamicThread||"—"}</span>;
                    })()
                    :c.t==="elastic_num"?(()=>{
                      const globalIndex=(safePage-1)*pageSize+i;
                      const dynamicElastic=row.elastic_number||row.elastic_no||row.serial_number||(total-globalIndex);
                      return <span title={row.id?`Database ID: ${row.id}`:""} style={{display:"inline-flex",alignItems:"center",justifyContent:"flex-start",width:"100%",color:C.text,fontFamily:C.mono,fontSize:12,fontWeight:800,whiteSpace:"nowrap",textAlign:"left"}}>{dynamicElastic||"—"}</span>;
                    })()
                    :c.t==="lace_num"?(()=>{
                      const globalIndex=(safePage-1)*pageSize+i;
                      const dynamicLace=row.lace_number||row.lace_no||row.serial_number||(total-globalIndex);
                      return <span title={row.id?`Database ID: ${row.id}`:""} style={{display:"inline-flex",alignItems:"center",justifyContent:"flex-start",width:"100%",color:C.text,fontFamily:C.mono,fontSize:12,fontWeight:800,whiteSpace:"nowrap",textAlign:"left"}}>{dynamicLace||"—"}</span>;
                    })()
                    :c.t==="buckle_num"?(()=>{
                      const globalIndex=(safePage-1)*pageSize+i;
                      const dynamicBuckle=row.buckle_number||row.buckle_no||row.serial_number||(total-globalIndex);
                      return <span title={row.id?`Database ID: ${row.id}`:""} style={{display:"inline-flex",alignItems:"center",justifyContent:"flex-start",width:"100%",color:C.text,fontFamily:C.mono,fontSize:12,fontWeight:800,whiteSpace:"nowrap",textAlign:"left"}}>{dynamicBuckle||"—"}</span>;
                    })()
                    :c.t==="lining_num"?(()=>{
                      const globalIndex=(safePage-1)*pageSize+i;
                      const dynamicLining=row.lining_number||row.lining_no||row.serial_number||(total-globalIndex);
                      return <span title={row.id?`Database ID: ${row.id}`:""} style={{display:"inline-flex",alignItems:"center",justifyContent:"flex-start",width:"100%",color:C.text,fontFamily:C.mono,fontSize:12,fontWeight:800,whiteSpace:"nowrap",textAlign:"left"}}>{dynamicLining||"—"}</span>;
                    })()
                    :c.t==="farma_num"?(()=>{
                      const globalIndex=(safePage-1)*pageSize+i;
                      const dynamicFarma=row.farma_number||row.farma_no||row.serial_number||(total-globalIndex);
                      return <span title={row.id?`Database ID: ${row.id}`:""} style={{display:"inline-flex",alignItems:"center",justifyContent:"flex-start",width:"100%",color:C.text,fontFamily:C.mono,fontSize:12,fontWeight:800,whiteSpace:"nowrap",textAlign:"left"}}>{dynamicFarma||"—"}</span>;
                    })()
                    :c.t==="leather_num"?(()=>{
                      const globalIndex=(safePage-1)*pageSize+i;
                      const dynamicLeather=row.leather_number||row.leather_no||row.serial_number||(total-globalIndex);
                      return <span title={row.id?`Database ID: ${row.id}`:""} style={{display:"inline-flex",alignItems:"center",justifyContent:"flex-start",width:"100%",color:C.text,fontFamily:C.mono,fontSize:12,fontWeight:800,whiteSpace:"nowrap",textAlign:"left"}}>{dynamicLeather||"—"}</span>;
                    })()
                    :c.t==="upper_num"?(()=>{
                      const globalIndex=(safePage-1)*pageSize+i;
                      const dynamicUpper=row.upper_number||row.upper_no||row.serial_number||(total-globalIndex);
                      return <span title={row.id?`Database ID: ${row.id}`:""} style={{display:"inline-flex",alignItems:"center",justifyContent:"flex-start",width:"100%",color:C.text,fontFamily:C.mono,fontSize:12,fontWeight:800,whiteSpace:"nowrap",textAlign:"left"}}>{dynamicUpper||"—"}</span>;
                    })()
                    :c.t==="measurement_num"?(()=>{
                      const globalIndex=(safePage-1)*pageSize+i;
                      const dynamicMeasurement=row.measurement_number||row.measurement_no||row.serial_number||(total-globalIndex);
                      return <span title={row.id?`Database ID: ${row.id}`:""} style={{display:"inline-flex",alignItems:"center",justifyContent:"flex-start",width:"100%",color:C.text,fontFamily:C.mono,fontSize:12,fontWeight:800,whiteSpace:"nowrap",textAlign:"left"}}>{dynamicMeasurement||"—"}</span>;
                    })()
                    :c.t==="customer_num"?(()=>{
                      const globalIndex=(safePage-1)*pageSize+i;
                      const dynamicCustomer=row.customer_number||row.customer_no||row.serial_number||(total-globalIndex);
                      return <span title={row.id?`Database ID: ${row.id}`:""} style={{display:"inline-flex",alignItems:"center",justifyContent:"flex-start",width:"100%",color:C.text,fontFamily:C.mono,fontSize:12,fontWeight:800,whiteSpace:"nowrap",textAlign:"left"}}>{dynamicCustomer||"—"}</span>;
                    })()
                    :c.t==="pair_num"?(()=>{
                      const globalIndex=(safePage-1)*pageSize+i;
                      const dynamicPair=row.pair_number||row.pair_no||row.serial_number||(total-globalIndex);
                      return <span title={row.id?`Database ID: ${row.id}`:""} style={{display:"inline-flex",alignItems:"center",justifyContent:"flex-start",width:"100%",color:C.text,fontFamily:C.mono,fontSize:12,fontWeight:800,whiteSpace:"nowrap",textAlign:"left"}}>{dynamicPair||"—"}</span>;
                    })()
                    :c.t==="size_mode"?(()=>{
                      const raw=String(row.customer_size_mode||row.customer_size_type||"").trim();
                      const size=String(row.size||"").trim();
                      const hasPoints=[row.point_a,row.point_b,row.point_c,row.point_d,row.point_e,row.point_f].some(present);
                      const mode=raw||((size.toLowerCase().includes("measurement")||hasPoints)?"Provided Measurement":present(size)?"Generic Size":"—");
                      return <Badge v={mode}/>;
                    })()
                    :c.t==="wo_num"?(()=>{
                      const globalIndex=(safePage-1)*pageSize+i;
                      const dynamicWo=row.serial_number||row.work_order_number||row.work_order_no||(total-globalIndex);
                      return <span title={row.id?`Database ID: ${row.id}`:""} style={{display:"inline-flex",alignItems:"center",justifyContent:"flex-start",width:"100%",color:C.text,fontFamily:C.mono,fontSize:12,fontWeight:800,whiteSpace:"nowrap",textAlign:"left"}}>{dynamicWo||"—"}</span>;
                    })()
                    :c.t==="type_dept"?<div style={{display:"flex",flexDirection:"column",alignItems:"flex-start",gap:2,minWidth:0}}>
                      <span style={{color:C.text,fontSize:12,fontWeight:800,whiteSpace:"nowrap"}}>{row.work_order_type||"—"}</span>
                      <span style={{color:C.dim,fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",whiteSpace:"nowrap"}}>{row.department?`${row.department} Dept`:"—"}</span>
                    </div>
                    :c.t==="quality_status"?(()=>{
                      const qStat=workOrderQualitySummary(row);
                      const bv=qStat.label;
                      const bc=qStat.kind==="green"?C.badges.green:qStat.kind==="red"?C.badges.red:qStat.kind==="amber"?C.badges.amber:C.badges.gray;
                      const icon=qStat.kind==="green"?"ti-circle-check":qStat.kind==="red"?"ti-alert-triangle":qStat.kind==="amber"?"ti-alert-circle":"ti-minus";
                      return <span title={qStat.title||bv} style={{display:"inline-flex",alignItems:"center",gap:4,background:bc.bg,color:bc.c,padding:"3px 9px",borderRadius:0,fontSize:11,fontWeight:700,whiteSpace:"nowrap"}}>
                        <i className={"ti "+icon} style={{fontSize:10}}/>{bv}
                      </span>;
                    })()
                    :c.t==="farma_label"?<span style={{color:C.sub,fontSize:12,fontWeight:700,whiteSpace:"nowrap"}}>{farmaLabelValue(val)}</span>
                    :c.t==="farma_shape"?<span style={{color:C.sub,fontSize:12,fontWeight:700,whiteSpace:"nowrap"}}>{farmaShapeLabel(val)}</span>
                    :c.t==="lace_color"?(()=>{
                      const color=String(row.color||"").trim();
                      const missing=!color;
                      const label=missing?"Missing Color":color;
                      return <span title={missing?"No color selected yet":label} style={{display:"inline-flex",alignItems:"center",gap:8,color:missing?C.dim:C.text,fontSize:13,whiteSpace:"nowrap",minWidth:110}}>
                        <span style={{width:14,height:14,borderRadius:0,background:missing?"repeating-linear-gradient(45deg,#F3F3F1,#F3F3F1 3px,#D7D7D2 3px,#D7D7D2 6px)":laceColorHex(color),border:"1px solid rgba(0,0,0,0.28)",boxShadow:"inset 0 0 0 1px rgba(255,255,255,0.25)",flexShrink:0,display:"inline-block"}}/>
                        <span style={{fontWeight:missing?500:600}}><Highlight text={label} q={q}/></span>
                      </span>;
                    })()
                    :c.t==="buckle_color"?(()=>{
                      const color=String(row.color||"").trim();
                      const missing=!color;
                      const label=missing?"Missing Color":color;
                      return <span title={missing?"No color selected yet":label} style={{display:"inline-flex",alignItems:"center",gap:8,color:missing?C.dim:C.text,fontSize:13,whiteSpace:"nowrap",minWidth:110}}>
                        <span style={{width:14,height:14,borderRadius:0,background:missing?"repeating-linear-gradient(45deg,#F3F3F1,#F3F3F1 3px,#D7D7D2 3px,#D7D7D2 6px)":buckleColorHex(color),border:"1px solid rgba(0,0,0,0.28)",boxShadow:"inset 0 0 0 1px rgba(255,255,255,0.25)",flexShrink:0,display:"inline-block"}}/>
                        <span style={{fontWeight:missing?500:600}}><Highlight text={label} q={q}/></span>
                      </span>;
                    })()
                    :c.t==="leather_color"?(()=>{
                      const savedColor=String(row.color||"").trim();
                      const inferredColor=inferLeatherColor(row);
                      const color=savedColor||inferredColor;
                      const missing=!color;
                      const label=missing?"Missing Color":color;
                      return <span title={missing?"No color selected yet":label} style={{display:"inline-flex",alignItems:"center",gap:8,color:missing?C.dim:C.text,fontSize:13,whiteSpace:"nowrap",minWidth:110}}>
                        <span style={{width:14,height:14,borderRadius:0,background:missing?"repeating-linear-gradient(45deg,#F3F3F1,#F3F3F1 3px,#D7D7D2 3px,#D7D7D2 6px)":leatherColorHex(color),border:"1px solid rgba(0,0,0,0.28)",boxShadow:"inset 0 0 0 1px rgba(255,255,255,0.25)",flexShrink:0,display:"inline-block"}}/>
                        <span style={{fontWeight:missing?500:600}}>
                          <Highlight text={label} q={q}/>
                        </span>
                      </span>;
                    })()
                    :c.t==="img"?<Thumb src={val} onClick={val?()=>setLb(val):undefined}/>
                    :c.t==="video"?<VideoThumb src={val} sz={40} onClick={val?()=>setVideoLb(val):undefined}/>
                    :c.t==="id"?<span style={{display:"inline-flex",alignItems:"center",justifyContent:"flex-start",width:"100%",color:C.dim,fontFamily:C.mono,fontSize:11,textAlign:"left"}}>{val||"—"}</span>
                    :c.t==="date"?(()=>{
                      if(!val)return <span style={{color:C.dim}}>—</span>;
                      const d=new Date(val);
                      return <span style={{color:C.sub,fontFamily:C.mono,fontSize:11}}>
                        {isNaN(d)?val:d.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}
                      </span>;
                    })()
                    :c.t==="money"?<span style={{fontFamily:C.mono,fontSize:12,color:"#9A6008",fontWeight:700,letterSpacing:"0.01em"}}>₨{val!=null?Number(val).toLocaleString():"—"}</span>
                    :c.t==="badge"||c.t==="status_done"?(()=>{
                      const bv=c.t==="status_done"?(val&&val!=="false"&&val!=="No"?"Completed":"In Progress"):val;
                      const bc=badge(bv);
                      const isGood=["completed","available","done","pass","resolved","delivered"].some(x=>(bv||"").toLowerCase().includes(x));
                      const isBad=["unfinish","fail","open","critical","repair"].some(x=>(bv||"").toLowerCase().includes(x));
                      return <span style={{display:"inline-flex",alignItems:"center",gap:4,
                        background:bc.bg,color:bc.c,padding:"3px 9px",borderRadius:0,
                        fontSize:11,fontWeight:600,whiteSpace:"nowrap"}}>
                        <i className={"ti "+(isGood?"ti-circle-check":isBad?"ti-clock":"ti-point")}
                          style={{fontSize:10}}/>{bv||"—"}
                      </span>;
                    })()
                    :c.t==="bool"?<span style={{color:val&&val!=="false"&&val!=="No"?C.ok:C.dim,
                      fontSize:12,display:"flex",alignItems:"center",gap:3,justifyContent:align==="center"?"center":"flex-start"}}>
                      <i className={"ti "+(val&&val!=="false"&&val!=="No"?"ti-check":"ti-x")} style={{fontSize:11}}/>
                      {val&&val!=="false"&&val!=="No"?"Yes":"No"}
                    </span>
                    :c.k==="color"||c.k==="colour"?<span style={{display:"flex",alignItems:"center",gap:7,color:C.text,fontSize:13}}>
                      <span title={val||""} style={{width:13,height:13,borderRadius:0,background:leatherColorHex(val),
                        border:"1px solid rgba(0,0,0,0.22)",boxShadow:"inset 0 0 0 1px rgba(255,255,255,0.25)",flexShrink:0,display:"inline-block"}}/>
                      <Highlight text={val!=null?String(val):""} q={q}/>
                    </span>
                    :c.k==="location_storage"||c.k==="location"?<span style={{display:"flex",alignItems:"center",gap:3,color:C.sub,fontSize:12}}>
                      {val?<><i className="ti ti-map-pin" style={{fontSize:11,color:C.accent}}/>{val}</>:<span style={{color:C.dim}}>—</span>}
                    </span>
                    :<span style={{color:primary?C.text:C.sub,fontWeight:primary?600:400}}>
                      <Highlight text={val!=null?String(val):""} q={q}/>
                    </span>}
                  </td>;
                })}
                {/* Trend cell */}
                <td style={{padding:"0 12px",height:dens.rh,verticalAlign:"middle",textAlign:"left"}}
                  onClick={e=>e.stopPropagation()}>
                  {trend?<span title={trend.label} style={{fontSize:dens.fs,color:trend.c,
                    cursor:"help",display:"inline-flex",alignItems:"center",gap:3,
                    background:`${trend.c}12`,padding:"2px 7px",borderRadius:0,
                    fontSize:11,fontWeight:600,whiteSpace:"nowrap"}}>
                    {trend.icon} <span style={{fontSize:10}}>{trend.label}</span>
                  </span>:<span style={{color:C.dim,fontSize:11}}>—</span>}
                </td>
                <td style={{padding:"0 6px",height:dens.rh,verticalAlign:"middle",textAlign:"left",whiteSpace:"nowrap"}} onClick={e=>e.stopPropagation()}>
                  <button onClick={e=>{e.stopPropagation();onEdit(row);}}
                    style={{background:"none",border:"1px solid transparent",color:C.dim,
                      cursor:"pointer",padding:"5px 7px",borderRadius:0,lineHeight:1,transition:"all 0.1s"}}
                    title="Edit"
                    onMouseEnter={e=>{e.currentTarget.style.background=C.accentD;e.currentTarget.style.borderColor=C.accent;e.currentTarget.style.color=C.accent;}}
                    onMouseLeave={e=>{e.currentTarget.style.background="none";e.currentTarget.style.borderColor="transparent";e.currentTarget.style.color=C.dim;}}>
                    <i className="ti ti-pencil" style={{fontSize:13}}/>
                  </button>
                  <button onClick={async e=>{e.stopPropagation();await onDelete([row.id]);}}
                    disabled={!row.id}
                    style={{background:"none",border:"1px solid transparent",color:C.dim,
                      cursor:row.id?"pointer":"not-allowed",padding:"5px 7px",borderRadius:0,lineHeight:1,transition:"all 0.1s",opacity:row.id?1:0.45}}
                    title="Delete"
                    onMouseEnter={e=>{if(row.id){e.currentTarget.style.background="#FEF2F2";e.currentTarget.style.borderColor="#FCA5A5";e.currentTarget.style.color="#DC2626";}}}
                    onMouseLeave={e=>{e.currentTarget.style.background="none";e.currentTarget.style.borderColor="transparent";e.currentTarget.style.color=C.dim;}}>
                    <i className="ti ti-trash" style={{fontSize:13}}/>
                  </button>
                </td>
              </tr>;
            })}
          </tbody>
        </table>
      </div>
    )}

    {/* ── Footer: pagination ── */}
    <div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 16px",
      borderTop:`1px solid ${C.border}`,flexShrink:0,background:"#F6F6F4",flexWrap:"wrap",rowGap:6}}>
      <span style={{color:C.dim,fontSize:11,flex:"1 1 120px"}}>
        {total} record{total!==1?"s":""}
        {q&&<span style={{color:C.accent}}> · "{q}"</span>}
        {(activeFilters.length>0||activeChip||activeSizeFilter||activeFarmaFilter)&&<span style={{color:C.accent}}> · filtered</span>}
        {selected.size>0&&<span style={{color:C.accent}}> · {selected.size} selected</span>}
      </span>
      <div style={{display:"flex",alignItems:"center",gap:6}}>
        <span style={{color:C.dim,fontSize:11}}>Rows:</span>
        <select value={pageSize} onChange={e=>{setPageSize(Number(e.target.value));setPage(1);}}
          style={{background:"#F5F5F5",border:`1px solid ${C.border}`,borderRadius:0,
            padding:"3px 8px",color:C.sub,fontSize:11,cursor:"pointer",outline:"none"}}>
          {[10,25,50,100].map(n=><option key={n} value={n}>{n}</option>)}
        </select>
      </div>
      {totalPages>1&&<div style={{display:"flex",alignItems:"center",gap:3}}>
        <PgBtn label="«" onClick={()=>setPage(1)} disabled={safePage<=1}/>
        <PgBtn label="‹" onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={safePage<=1}/>
        {Array.from({length:totalPages},(_,i)=>i+1)
          .filter(p=>totalPages<=7||p===1||p===totalPages||Math.abs(p-safePage)<=1)
          .map((p,idx,arr)=><PgBtn key={p} label={p} onClick={()=>setPage(p)} active={p===safePage}/>)}
        <PgBtn label="›" onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={safePage>=totalPages}/>
        <PgBtn label="»" onClick={()=>setPage(totalPages)} disabled={safePage>=totalPages}/>
        <span style={{color:C.dim,fontSize:11,marginLeft:4}}>Go:</span>
        <input type="number" min={1} max={totalPages} defaultValue={safePage} key={safePage}
          onKeyDown={e=>{if(e.key==="Enter"){const v=parseInt(e.target.value);if(!isNaN(v))setPage(Math.min(totalPages,Math.max(1,v)));e.target.blur();}}}
          style={{width:40,background:"#F5F5F5",border:`1px solid ${C.border}`,
            borderRadius:0,padding:"3px 5px",color:C.sub,fontSize:11,textAlign:"left",outline:"none"}}/>
      </div>}
    </div>
    {lb&&<Lightbox src={lb} onClose={()=>setLb(null)}/>}
    {videoLb&&<VideoLightbox src={videoLb} onClose={()=>setVideoLb(null)}/>}
  </div>;
}

function PgBtn({label,onClick,disabled,active}){
  return <button onClick={onClick} disabled={disabled}
    style={{minWidth:26,height:24,padding:"0 5px",
      background:active?C.accent:"#F5F5F5",
      border:`1px solid ${active?C.accent:C.border}`,
      borderRadius:0,color:active?"#111":disabled?C.dim:C.sub,
      cursor:disabled?"not-allowed":"pointer",
      fontSize:11,fontWeight:active?600:400,
      lineHeight:"22px",display:"inline-flex",alignItems:"center",justifyContent:"center"}}>
    {label}
  </button>;
}

// ── Auth Screen ──────────────────────────────────────────────
const IMG1="data:image/jpeg;base64,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";
const IMG2="data:image/jpeg;base64,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";

// ── Handsole Logo — SVG mark ─────────────────────────────────
function HSLogo({size=36,dark=false}){
  return(
    <img
      src={APP_LOGO_DATA_URI}
      alt="Handsole"
      style={{
        width:size,
        height:size,
        display:"block",
        objectFit:"contain",
        flexShrink:0,
        borderRadius:0
      }}
    />
  );
}

function CollapsibleNav({active,setActive,filteredNav,sidebarOpen,data,tabCounts}){
  const activeGroup=filteredNav.find(g=>g.items.some(i=>i.id===active))?.g;
  const[openGroups,setOpenGroups]=useState(()=>{
    const init={};
    filteredNav.forEach(g=>{init[g.g]=(g.g==="Production"||g.g===activeGroup);});
    return init;
  });
  const toggle=g=>setOpenGroups(p=>({...p,[g]:!p[g]}));
  React.useEffect(()=>{
    if(activeGroup)setOpenGroups(p=>({...p,[activeGroup]:true}));
  },[active]);

  const counts=tabCounts||{};

  const T={
    groupLabel:"#AAAAAA",groupHeader:"#F0EDE8",groupHeaderActive:"#F0B429",
    groupIcon:"#888880",groupIconActive:"#F0B429",subItem:"#C8C4BE",
    subItemActive:"#111111",divider:"#2A2A2A",border:"#2A2A2A",
    hover:"rgba(240,180,41,0.10)",count:"#555550",
  };

  return(
    <nav style={{flex:1,overflowY:"auto",overflowX:"hidden",
      padding:"4px 0",scrollbarWidth:"thin",scrollbarColor:"#2A2A2A transparent"}}>
      {/* Dashboard */}
      <div style={{padding:"6px 10px"}}>
        <button onClick={()=>setActive("dashboard")}
          style={{display:"flex",alignItems:"center",gap:10,width:"100%",
            padding:sidebarOpen?"9px 12px":"9px 8px",
            background:active==="dashboard"?C.accent:"transparent",
            border:"none",borderRadius:0,cursor:"pointer",
            justifyContent:sidebarOpen?"flex-start":"center",transition:"all 0.12s"}}
          onMouseEnter={e=>{if(active!=="dashboard")e.currentTarget.style.background=T.hover;}}
          onMouseLeave={e=>{if(active!=="dashboard")e.currentTarget.style.background="transparent";}}>
          <i className="ti ti-layout-dashboard" style={{fontSize:15,
            color:active==="dashboard"?"#111":T.groupIcon,width:18,textAlign:"left"}}/>
          {sidebarOpen&&<span style={{fontSize:13,fontWeight:active==="dashboard"?600:400,
            color:active==="dashboard"?"#111":T.groupHeader}}>Dashboard</span>}
        </button>
        <div style={{height:1,background:T.divider,margin:"6px 2px 0"}}/>
      </div>

      {filteredNav.map(g=>{
        const isSingle=g.items.length===1;
        const isOpen=openGroups[g.g];
        const hasActive=g.items.some(i=>i.id===active);

        if(g.g==="__SINGLES__"){
          return(
            <div key={g.g}>
              {sidebarOpen&&<div style={{height:1,background:T.divider,margin:"8px 10px 10px"}}/>}
              {g.items.map(item=>{
                const on=active===item.id;
                return(
                  <div key={item.id} style={{padding:"0 10px",marginBottom:1}}>
                    <button onClick={()=>setActive(item.id)} title={!sidebarOpen?item.l:""}
                      style={{display:"flex",alignItems:"center",gap:10,width:"100%",
                        padding:sidebarOpen?"8px 12px":"9px 8px",
                        background:on?C.accent:"transparent",border:"none",borderRadius:0,
                        cursor:"pointer",justifyContent:sidebarOpen?"flex-start":"center",
                        transition:"all 0.12s"}}
                      onMouseEnter={e=>{if(!on)e.currentTarget.style.background=T.hover;}}
                      onMouseLeave={e=>{if(!on)e.currentTarget.style.background="transparent";}}>
                      <i className={"ti "+item.i} style={{fontSize:14,flexShrink:0,
                        color:on?"#111":T.groupIcon,width:18,textAlign:"left"}}/>
                      {sidebarOpen&&<span style={{fontSize:12.5,fontWeight:on?600:400,
                        color:on?"#111":T.groupHeader,flex:1}}>{item.l}</span>}
                      {sidebarOpen&&counts[item.id]>0&&<span style={{fontSize:10,
                        fontFamily:C.mono,color:on?"rgba(0,0,0,0.5)":T.count,
                        flexShrink:0,marginLeft:4}}>{counts[item.id]}</span>}
                    </button>
                  </div>
                );
              })}
            </div>
          );
        }

        if(isSingle){
          const item=g.items[0];const on=active===item.id;
          return(
            <div key={g.g} style={{padding:"0 10px",marginBottom:1}}>
              <button onClick={()=>setActive(item.id)} title={!sidebarOpen?item.l:""}
                style={{display:"flex",alignItems:"center",gap:10,width:"100%",
                  padding:sidebarOpen?"9px 12px":"9px 8px",
                  background:on?C.accent:"transparent",border:"none",borderRadius:0,
                  cursor:"pointer",justifyContent:sidebarOpen?"flex-start":"center",
                  transition:"all 0.12s"}}
                onMouseEnter={e=>{if(!on)e.currentTarget.style.background=T.hover;}}
                onMouseLeave={e=>{if(!on)e.currentTarget.style.background="transparent";}}>
                <i className={"ti "+item.i} style={{fontSize:15,flexShrink:0,
                  color:on?"#111":T.groupIcon,width:18,textAlign:"left"}}/>
                {sidebarOpen&&<span style={{fontSize:13,fontWeight:on?600:400,
                  color:on?"#111":T.groupHeader,flex:1}}>{item.l}</span>}
              </button>
            </div>
          );
        }

        return(
          <div key={g.g} style={{padding:"0 10px",marginBottom:2}}>
            <button onClick={()=>toggle(g.g)} title={!sidebarOpen?g.g:""}
              style={{display:"flex",alignItems:"center",gap:10,width:"100%",
                padding:sidebarOpen?"10px 12px":"10px 8px",background:"transparent",
                border:isOpen&&sidebarOpen?`1px solid ${T.border}`:"1px solid transparent",
                borderRadius:0,cursor:"pointer",
                justifyContent:sidebarOpen?"flex-start":"center",transition:"all 0.15s"}}
              onMouseEnter={e=>{if(!isOpen)e.currentTarget.style.background="rgba(255,255,255,0.05)";}}
              onMouseLeave={e=>{if(!isOpen)e.currentTarget.style.background="transparent";}}>
              <i className={"ti "+g.icon} style={{fontSize:17,flexShrink:0,width:20,
                textAlign:"left",color:hasActive?T.groupIconActive:T.groupIcon}}/>
              {sidebarOpen&&<span style={{fontSize:13.5,fontWeight:600,flex:1,
                whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",
                color:hasActive?T.groupHeaderActive:T.groupHeader}}>{g.g}</span>}
              {sidebarOpen&&<i className={`ti ti-chevron-${isOpen?"down":"right"}`}
                style={{fontSize:11,color:T.groupLabel,flexShrink:0}}/>}
            </button>

            {isOpen&&sidebarOpen&&(
              <div style={{marginLeft:12,paddingLeft:10,
                borderLeft:`1.5px solid #333330`,marginTop:2,marginBottom:6}}>
                {g.items.map(item=>{
                  const on=active===item.id;
                  const cnt=counts[item.id];
                  return(
                    <button key={item.id} onClick={()=>setActive(item.id)}
                      style={{display:"flex",alignItems:"center",justifyContent:"space-between",
                        width:"100%",padding:"8px 12px",
                        background:on?C.accent:"transparent",
                        border:"none",borderRadius:0,cursor:"pointer",
                        marginBottom:1,transition:"all 0.1s"}}
                      onMouseEnter={e=>{if(!on)e.currentTarget.style.background=T.hover;}}
                      onMouseLeave={e=>{if(!on)e.currentTarget.style.background="transparent";}}>
                      <span style={{fontSize:13,fontWeight:on?600:400,
                        color:on?T.subItemActive:T.subItem,
                        whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                        {item.l}
                      </span>
                      {cnt>0&&<span style={{fontSize:10,flexShrink:0,marginLeft:6,
                        fontFamily:C.mono,
                        color:on?"rgba(0,0,0,0.45)":T.count}}>{cnt}</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}


function AuthScreen({api,onAuth}){
  const[tab,setTab]=useState("in");
  const[email,setEmail]=useState("");const[pw,setPw]=useState("");
  const[loading,setLoading]=useState(false);const[err,setErr]=useState("");const[msg,setMsg]=useState("");
  const[imgIdx,setImgIdx]=useState(0);

  const IMGS=[
    {src:IMG1,caption:"Cutting leather patterns by hand",tag:"Pattern Making"},
    {src:IMG2,caption:"Lasting — shaping the upper over the farma",tag:"Lasting Process"},
  ];

  React.useEffect(()=>{
    const t=setInterval(()=>setImgIdx(i=>(i+1)%IMGS.length),5000);
    return()=>clearInterval(t);
  },[]);

  const go=async()=>{
    setErr("");setMsg("");
    if(!email||!pw){setErr("Please enter your email and password.");return;}
    if(pw.length<6){setErr("Password must be at least 6 characters.");return;}
    setLoading(true);
    try{
      const res=tab==="in"?await api.signIn(email,pw):await api.signUp(email,pw);
      if(res.error||res.error_code)setErr(res.error_description||res.message||"Authentication failed.");
      else if(tab==="up"&&!res.access_token)setMsg("✓ Account created! Check your email, then sign in.");
      else if(res.access_token)onAuth(res.access_token,res.user);
    }catch{setErr("Connection error. Please try again.");}
    setLoading(false);
  };
  const forgotPw=async()=>{
    if(!email){setErr("Enter your email address first.");return;}
    setLoading(true);setErr("");
    try{await api.recover(email);setMsg("✓ Reset link sent to your inbox.");}
    catch{setErr("Could not send reset email.");}
    setLoading(false);
  };

  const inp={width:"100%",padding:"13px 16px",fontSize:14,border:"1.5px solid #E8E8E6",
    borderRadius:0,outline:"none",background:"#FFFFFF",color:"#111110",
    fontFamily:"inherit",boxSizing:"border-box",transition:"border-color 0.15s"};
  const cur=IMGS[imgIdx];

  return(
    <div style={{display:"flex",minHeight:"100vh",fontFamily:"'Inter',system-ui,sans-serif"}}>
      {/* LEFT — real photos */}
      <div style={{width:"52%",minWidth:380,position:"relative",overflow:"hidden",flexShrink:0}}>
        {IMGS.map((img,i)=>(
          <div key={i} style={{position:"absolute",inset:0,
            backgroundImage:`url(${img.src})`,backgroundSize:"cover",backgroundPosition:"center",
            opacity:i===imgIdx?1:0,transition:"opacity 1.2s ease"}}/>
        ))}
        {/* Gradient overlays */}
        <div style={{position:"absolute",inset:0,
          background:"linear-gradient(180deg,rgba(0,0,0,0.60) 0%,rgba(0,0,0,0.05) 38%,rgba(0,0,0,0.05) 55%,rgba(0,0,0,0.80) 100%)"}}/>
        <div style={{position:"absolute",inset:0,boxShadow:"inset 0 0 80px rgba(0,0,0,0.35)"}}/>
        {/* Top: Logo */}
        <div style={{position:"absolute",top:0,left:0,right:0,
          display:"flex",alignItems:"center",gap:12,padding:"28px 32px",zIndex:2}}>
          <HSLogo size={64} dark={true}/>
          <div>
            <p style={{color:"#FFFFFF",fontSize:16,fontWeight:700,margin:0,
              fontFamily:"'Outfit',sans-serif",textShadow:"0 1px 4px rgba(0,0,0,0.5)"}}>Handsole</p>
            <p style={{color:"rgba(255,255,255,0.45)",fontSize:9,margin:0,
              letterSpacing:"0.12em",textTransform:"uppercase",fontWeight:600}}>Workshop OS</p>
          </div>
        </div>
        {/* Bottom: caption */}
        <div style={{position:"absolute",bottom:0,left:0,right:0,padding:"32px 36px",zIndex:2}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:6,
            background:"rgba(240,180,41,0.18)",border:"1px solid rgba(240,180,41,0.40)",
            borderRadius:0,padding:"4px 14px",marginBottom:14,backdropFilter:"blur(4px)"}}>
            <div style={{width:5,height:5,borderRadius:0,background:"#F0B429"}}/>
            <span style={{color:"#F0B429",fontSize:10,fontWeight:700,
              letterSpacing:"0.1em",textTransform:"uppercase"}}>{cur.tag}</span>
          </div>
          <h2 style={{color:"#FFFFFF",fontSize:26,fontWeight:700,
            fontFamily:"'Outfit',sans-serif",letterSpacing:"-0.02em",
            lineHeight:1.25,margin:"0 0 8px",textShadow:"0 2px 8px rgba(0,0,0,0.5)"}}>
            {cur.caption}
          </h2>
          <p style={{color:"rgba(255,255,255,0.60)",fontSize:13,margin:"0 0 20px",lineHeight:1.5}}>
            Every pair crafted with precision — from pattern to finished shoe.
          </p>
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            {IMGS.map((_,i)=>(
              <button key={i} onClick={()=>setImgIdx(i)}
                style={{width:i===imgIdx?24:6,height:6,borderRadius:0,border:"none",
                  cursor:"pointer",padding:0,transition:"all 0.3s",
                  background:i===imgIdx?"#F0B429":"rgba(255,255,255,0.35)"}}/>
            ))}
          </div>
        </div>
        {/* Vertical tagline */}
        <div style={{position:"absolute",right:16,top:"50%",zIndex:2,
          transform:"translateY(-50%) rotate(90deg)",transformOrigin:"center center"}}>
          <p style={{color:"rgba(255,255,255,0.18)",fontSize:9,letterSpacing:"0.25em",
            textTransform:"uppercase",fontWeight:700,margin:0,whiteSpace:"nowrap"}}>
            100 YEARS OF EXPERIENCE
          </p>
        </div>
      </div>

      {/* RIGHT — Form */}
      <div style={{flex:1,background:"#F9F9F7",display:"flex",alignItems:"center",
        justifyContent:"center",padding:"48px 40px",minWidth:0,overflowY:"auto"}}>
        <div style={{width:"100%",maxWidth:400}}>
          <div style={{marginBottom:32}}>
            <h2 style={{color:"#111110",fontSize:27,fontWeight:700,margin:"0 0 7px",
              letterSpacing:"-0.02em",fontFamily:"'Outfit',sans-serif"}}>
              {tab==="in"?"Welcome back":"Create account"}
            </h2>
            <p style={{color:"#6B6B6B",fontSize:14,margin:0}}>
              {tab==="in"?"Sign in to your workshop dashboard":"Start managing your workshop today"}
            </p>
          </div>
          {/* Tabs */}
          <div style={{display:"flex",background:"#EEEEEC",padding:4,borderRadius:0,marginBottom:26,gap:4}}>
            {[{id:"in",l:"Sign In"},{id:"up",l:"Create Account"}].map(t=>(
              <button key={t.id} onClick={()=>{setTab(t.id);setErr("");setMsg("");}}
                style={{flex:1,padding:"10px",background:tab===t.id?"#FFFFFF":"transparent",
                  border:"none",borderRadius:0,cursor:"pointer",fontSize:13,fontWeight:600,
                  color:tab===t.id?"#111110":"#6B6B6B",
                  boxShadow:tab===t.id?"0 1px 4px rgba(0,0,0,0.10)":"none",
                  transition:"all 0.15s"}}>{t.l}
              </button>
            ))}
          </div>
          {/* Email */}
          <label style={{display:"block",fontSize:12,fontWeight:600,color:"#6B6B6B",
            marginBottom:7,letterSpacing:"0.02em"}}>Email address</label>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
            placeholder="you@example.com" style={{...inp,marginBottom:16}}
            onFocus={e=>e.target.style.borderColor="#F0B429"}
            onBlur={e=>e.target.style.borderColor="#E8E8E6"}
            onKeyDown={e=>e.key==="Enter"&&go()}/>
          {/* Password */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:7}}>
            <label style={{fontSize:12,fontWeight:600,color:"#6B6B6B",letterSpacing:"0.02em"}}>Password</label>
            {tab==="in"&&<button onClick={forgotPw} style={{background:"none",border:"none",
              color:"#F0B429",fontSize:12,cursor:"pointer",padding:0,fontWeight:500,fontFamily:"inherit"}}>
              Forgot password?</button>}
          </div>
          <input type="password" value={pw} onChange={e=>setPw(e.target.value)}
            placeholder="Min. 6 characters" style={{...inp,marginBottom:22}}
            onFocus={e=>e.target.style.borderColor="#F0B429"}
            onBlur={e=>e.target.style.borderColor="#E8E8E6"}
            onKeyDown={e=>e.key==="Enter"&&go()}/>
          {err&&<div style={{display:"flex",alignItems:"flex-start",gap:10,background:"#FEF2F2",
            border:"1px solid #FCA5A5",borderRadius:0,padding:"12px 14px",marginBottom:18}}>
            <i className="ti ti-alert-circle" style={{fontSize:16,color:"#DC2626",marginTop:1,flexShrink:0}}/>
            <p style={{color:"#991B1B",fontSize:13,margin:0,lineHeight:1.4}}>{err}</p>
          </div>}
          {msg&&<div style={{display:"flex",alignItems:"flex-start",gap:10,background:"#F0FDF4",
            border:"1px solid #86EFAC",borderRadius:0,padding:"12px 14px",marginBottom:18}}>
            <i className="ti ti-circle-check" style={{fontSize:16,color:"#16A34A",marginTop:1,flexShrink:0}}/>
            <p style={{color:"#15803D",fontSize:13,margin:0,lineHeight:1.4}}>{msg}</p>
          </div>}
          <button onClick={go} disabled={loading}
            style={{width:"100%",background:loading?"#D8C89A":C.accent,
              border:"none",color:"#111110",borderRadius:0,padding:"14px",
              cursor:loading?"wait":"pointer",fontSize:15,fontWeight:700,
              boxShadow:loading?"none":"0 2px 16px rgba(240,180,41,0.30)",transition:"all 0.15s"}}>
            {loading?"Please wait…":tab==="in"?"Sign In →":"Create Account →"}
          </button>
          <p style={{textAlign:"left",color:"#CCCCCC",fontSize:11,marginTop:24}}>
            Handsole Workshop OS · Secure login
          </p>
        </div>
      </div>
    </div>
  );
}


function Dashboard({data,onNavigate}){
  const wo=data.work_orders||[];const cu=data.customers||[];
  const inv=data.inventory||[];const inc=data.income||[];

  const open=wo.filter(w=>!w.is_done&&w.is_done!=="true").length;
  const completed=wo.filter(w=>w.is_done===true||w.is_done==="true").length;
  const avail=inv.filter(i=>i.status==="Available").length;
  const finDone=inv.filter(i=>i.finish_status==="Completed Finish").length;
  const finUndone=inv.filter(i=>i.finish_status==="Unfinish").length;
  const income=inc.reduce((s,r)=>s+(Number(r.amount_received)||0),0);
  const pct=inv.length?Math.round((finDone/inv.length)*100):0;
  const hour=new Date().getHours();
  const greet=hour<12?"Good morning":hour<17?"Good afternoon":"Good evening";
  const uname=data._user?.email?.split("@")[0]||"Syed";

  // Type breakdown from inventory
  const byType={};
  inv.forEach(p=>{if(p.type){byType[p.type]=(byType[p.type]||0)+1;}});
  const topTypes=Object.entries(byType).sort((a,b)=>b[1]-a[1]).slice(0,4);

  // Donut chart helper
  const Donut=({pct,size=100,stroke=10,color="#F0B429"})=>{
    const r=(size-stroke)/2;const circ=2*Math.PI*r;const dash=circ*(pct/100);
    return <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.border} strokeWidth={stroke}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{transition:"stroke-dasharray 0.8s ease"}}/>
    </svg>;
  };

  const KCard=({label,val,unit,icon,color,sub})=>(
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:0,
      padding:"18px 20px",flex:"1 1 140px",minWidth:0,position:"relative",overflow:"hidden"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
        <span style={{fontSize:10,fontWeight:700,textTransform:"uppercase",
          letterSpacing:"0.08em",color:C.dim}}>{label}</span>
        <div style={{width:28,height:28,borderRadius:0,
          background:`${color}18`,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <i className={"ti "+icon} style={{fontSize:14,color}}/>
        </div>
      </div>
      <p style={{fontFamily:C.mono,fontSize:32,fontWeight:600,color,margin:0,lineHeight:1,
        letterSpacing:"-0.02em"}}>
        {unit&&<span style={{fontSize:16,color:C.sub,marginRight:2}}>{unit}</span>}{val}
      </p>
      {sub&&<p style={{fontSize:11,color:C.dim,margin:"5px 0 0"}}>{sub}</p>}
      <div style={{position:"absolute",bottom:0,left:0,right:0,height:2,
        background:`${color}30`}}/>
    </div>
  );

  return(
    <div style={{height:"100%",overflowY:"auto",background:C.bg}}>
      {/* Header */}
      <div style={{background:C.card,borderBottom:`1px solid ${C.border}`,
        padding:"20px 32px 18px"}}>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between"}}>
          <div>
            <p style={{color:C.dim,fontSize:11,margin:"0 0 4px",
              display:"flex",alignItems:"center",gap:6}}>
              <span style={{width:7,height:7,borderRadius:0,
                background:C.ok,display:"inline-block"}}/>
              {new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"})}
            </p>
            <h1 style={{color:C.text,fontSize:26,fontWeight:700,margin:0,
              fontFamily:"'Outfit',sans-serif",letterSpacing:"-0.02em"}}>
              {greet}, {uname}
            </h1>
            <p style={{color:C.sub,fontSize:13,margin:"4px 0 0"}}>
              Here's what's happening in your workshop today.
            </p>
          </div>

        </div>
      </div>

      <div style={{padding:"24px 32px",display:"flex",flexDirection:"column",gap:24}}>
        {/* KPI Row */}
        <div style={{display:"flex",gap:14,flexWrap:"wrap"}}>
          <KCard label="Finished Inventory" val={inv.length} icon="ti-stack" color={C.accent} sub="total pairs"/>
          <KCard label="Completed Finish" val={finDone} icon="ti-circle-check" color="#15803D" sub={`${pct}% completion rate`}/>
          <KCard label="Unfinished" val={finUndone} icon="ti-clock" color="#DC2626" sub="needs finishing"/>
          <KCard label="Active Work Orders" val={open} icon="ti-clipboard-list" color="#1D4ED8" sub={`${completed} completed`}/>
          <KCard label="Available Stock" val={avail} icon="ti-package" color="#7C3AED" sub="ready to sell"/>
        </div>

        {/* Middle row */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 320px",gap:20}}>
          {/* Recent Work Orders — table style */}
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:0,overflow:"hidden"}}>
            <div style={{padding:"16px 20px",borderBottom:`1px solid ${C.border}`,
              display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div>
                <p style={{fontSize:14,fontWeight:600,color:C.text,margin:0}}>Recent Work Orders</p>
                <p style={{fontSize:11,color:C.dim,margin:"2px 0 0"}}>{wo.length} total orders</p>
              </div>
              <button onClick={()=>onNavigate("work_orders")}
                style={{background:"none",border:`1px solid ${C.border}`,color:C.accent,
                  borderRadius:0,padding:"5px 12px",cursor:"pointer",fontSize:12,fontWeight:600}}>
                View all →
              </button>
            </div>
            {wo.length===0
              ?<div style={{padding:"40px 20px",textAlign:"left",color:C.dim,fontSize:13}}>
                  No work orders yet
                </div>
              :<table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead><tr style={{background:C.bg}}>
                  {["ORDER","CUSTOMER","TYPE","STATUS"].map(h=>(
                    <th key={h} style={{textAlign:"left",padding:"8px 16px",
                      fontSize:9,fontWeight:700,color:C.dim,
                      textTransform:"uppercase",letterSpacing:"0.08em",
                      borderBottom:`1px solid ${C.border}`}}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>{wo.slice(-6).reverse().map((w,i,arr)=>{
                  const bc=(()=>{const s=(w.is_done?"Completed":"In Progress").toLowerCase();
                    if(s.includes("complete"))return{bg:"#F0FDF4",c:"#15803D"};
                    return{bg:"#FFFBEB",c:"#92400E"};})();
                  return <tr key={w.id}
                    style={{borderBottom:i<arr.length-1?`1px solid ${C.border}`:"none"}}
                    onMouseEnter={e=>e.currentTarget.style.background="#FAFAF8"}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <td style={{padding:"12px 16px"}}>
                      <p style={{fontFamily:C.mono,fontSize:11,color:C.sub,margin:0}}>
                        {w.serial_number||`WO-${w.id}`}</p>
                    </td>
                    <td style={{padding:"12px 16px"}}>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <Thumb src={w.image_url} sz={28}/>
                        <span style={{fontSize:13,fontWeight:500,color:C.text}}>{w.customer_name||"—"}</span>
                      </div>
                    </td>
                    <td style={{padding:"12px 16px"}}>
                      <span style={{fontSize:12,color:C.sub}}>{w.design_name||w.type||"—"}</span>
                    </td>
                    <td style={{padding:"12px 16px"}}>
                      <span style={{background:bc.bg,color:bc.c,padding:"3px 9px",
                        borderRadius:0,fontSize:11,fontWeight:600}}>
                        {w.is_done&&w.is_done!=="false"?"Completed":"In Progress"}
                      </span>
                    </td>
                  </tr>;
                })}</tbody>
              </table>
            }
          </div>

          {/* Right column */}
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            {/* Finish status donut */}
            <div style={{background:C.card,border:`1px solid ${C.border}`,
              borderRadius:0,padding:"18px 20px"}}>
              <p style={{fontSize:13,fontWeight:600,color:C.text,margin:"0 0 14px"}}>Finish Status</p>
              <div style={{display:"flex",alignItems:"center",gap:16}}>
                <div style={{position:"relative",flexShrink:0}}>
                  <Donut pct={pct} size={90} stroke={9} color={pct>70?"#15803D":"#F0B429"}/>
                  <div style={{position:"absolute",inset:0,display:"flex",
                    alignItems:"center",justifyContent:"center"}}>
                    <span style={{fontFamily:C.mono,fontSize:16,fontWeight:700,
                      color:C.text,transform:"rotate(0deg)"}}>{pct}%</span>
                  </div>
                </div>
                <div style={{flex:1}}>
                  {[{l:"Completed",v:finDone,c:"#15803D"},{l:"Unfinished",v:finUndone,c:"#DC2626"},
                    {l:"In Progress",v:inv.filter(i=>i.finish_status==="In Progress").length,c:"#D97706"}
                  ].map(({l,v,c})=>(
                    <div key={l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:7}}>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <div style={{width:8,height:8,borderRadius:0,background:c,flexShrink:0}}/>
                        <span style={{fontSize:11,color:C.sub}}>{l}</span>
                      </div>
                      <span style={{fontFamily:C.mono,fontSize:12,fontWeight:600,color:C.text}}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom stats */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:12}}>
          {[
            {l:"Work Orders",v:wo.length,icon:"ti-clipboard-list"},
            {l:"Customers",v:cu.length,icon:"ti-users"},
            {l:"Inventory Pairs",v:inv.length,icon:"ti-package"},
            {l:"Income Records",v:inc.length,icon:"ti-report-money"},
          ].map(({l,v,icon})=>(
            <div key={l} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:0,padding:"14px 16px",display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:32,height:32,borderRadius:0,background:C.accentD,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <i className={"ti "+icon} style={{fontSize:15,color:C.accent}}/>
              </div>
              <div>
                <p style={{fontFamily:C.mono,fontSize:20,fontWeight:600,color:C.text,margin:0,lineHeight:1}}>{v.toLocaleString()}</p>
                <p style={{fontSize:11,color:C.dim,margin:"3px 0 0"}}>{l}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
export default function HandsoleApp(){
  const[session,setSession]=useState(null);
  const[active,setActive]=useState("dashboard");
  const[sidebarOpen,setSidebarOpen]=useState(true);
  const[data,setData]=useState({});
  const[loadingMod,setLoadingMod]=useState(null);
  const[modal,setModal]=useState(null);
  const[saving,setSaving]=useState(false);
  const[navQ,setNavQ]=useState("");
  const[tabCounts,setTabCounts]=useState({});

  useEffect(()=>{
    ["https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap",
     "https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.31.0/dist/tabler-icons.min.css"
    ].forEach(href=>{const l=document.createElement("link");l.rel="stylesheet";l.href=href;document.head.appendChild(l);});
    document.title="Handsole OS";
    const fav=document.createElement("link");fav.rel="icon";fav.type="image/svg+xml";
    fav.href='data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="18" fill="%23F0B429"/><text x="50" y="68" text-anchor="middle" font-size="50" font-weight="700" font-family="serif" fill="%23111">HS</text></svg>';
    document.head.appendChild(fav);
  },[]);

  // Inject 2026 global styles
  useEffect(()=>{
    const style=document.createElement("style");
    style.textContent=`
      *{box-sizing:border-box;-webkit-font-smoothing:antialiased;}
      ::-webkit-scrollbar{width:5px;height:5px;}
      ::-webkit-scrollbar-track{background:transparent;}
      ::-webkit-scrollbar-thumb{background:#D8D8D5;border-radius:0;}
      ::-webkit-scrollbar-thumb:hover{background:#AAAAAA;}
      input,select,textarea{transition:border-color 0.15s;}
      input:focus,select:focus,textarea:focus{border-color:#F0B429 !important;box-shadow:0 0 0 3px rgba(240,180,41,0.12);}
      button{transition:opacity 0.15s,background 0.15s;}
      tr{transition:background 0.08s;}
    `;
    document.head.appendChild(style);
  },[]);

  const api=()=>sbApi(SB_URL,SB_KEY);

  const fetchAllCounts=async(tok)=>{
    const entries=Object.entries(TABLE_MAP).filter(([k])=>k!=="__access");
    const results=await Promise.all(
      entries.map(async([modId,table])=>{
        const n=await api().count(table,tok);
        return[modId,n];
      })
    );
    setTabCounts(Object.fromEntries(results));
  };

  const loadMod=async(id)=>{
    if(!session||!TABLE_MAP[id])return;
    setLoadingMod(id);
    try{const rows=await api().list(TABLE_MAP[id],session.token);if(Array.isArray(rows))setData(d=>({...d,[id]:rows}));}
    catch(e){console.error(e);}
    setLoadingMod(null);
  };

  useEffect(()=>{if(session)fetchAllCounts(session.token);},[session]);

  useEffect(()=>{
    if(!session)return;
    if(active==="dashboard")["work_orders","customers","inventory","income"].forEach(loadMod);
    else if(active!=="__import"&&active!=="__access")loadMod(active);
  },[active,session]);

  useEffect(()=>{
    Object.entries(data).forEach(([modId,rows])=>{
      if(Array.isArray(rows)&&rows.length>0)
        setTabCounts(prev=>({...prev,[modId]:rows.length}));
    });
  },[data]);

  const saveRec=async(rec)=>{
    setSaving(true);
    try{
      const tn=TABLE_MAP[active];const{id,...rest}=rec;
      // Keep a full copy for frontend-only workflow logic before stripping DB-unsafe fields.
      const workflowForm={...rest};
      // Never send generated/read-only/computed columns back to Supabase.
      // balance_payment is a generated/default-only field in work_orders, so PATCH/INSERT fails if we include it.
      ["balance_payment"].forEach(k=>{ if(k in rest) delete rest[k]; });
      if(active==="videos") delete rest.image_url;
      if(active==="work_orders"){
        // Work Orders do not have an image_url column. Use representative_image_url for the WO photo.
        if(rest.image_url && !rest.representative_image_url) rest.representative_image_url = rest.image_url;
        if("image_url" in rest) delete rest.image_url;
        // These are frontend workflow helper fields. They drive material_usage_log, but are NOT columns in work_orders.
        const woOnlyUiFields=[
          "material_usage_action","used_by","date_used",
          "upper_leather_qty_used","lining_leather_qty_used","buckle_qty_used","lace_qty_used","elastic_qty_used","thread_qty_used",
          "leather_sole_qty_used","rubber_sole_qty_used","putha_qty_used","heel_qty_used","heel_top_qty_used","sooti_qty_used","sooti_usage_type","sooti_half_full","is_sooti_used","sole_material_choice",
          "sole_sheet_qty_used","leather_board_qty_used","mek_qty_used","finishing_qty_used","shoe_polish_qty_used","solution_qty_used"
        ];
        woOnlyUiFields.forEach(k=>{ if(k in rest) delete rest[k]; });
        // Extra guard for any future usage helper field added later.
        Object.keys(rest).forEach(k=>{
          if(k.endsWith("_qty_used")||k.includes("material_usage")||["date_used","used_by"].includes(k)) delete rest[k];
        });
        if(!rest.work_order_type||String(rest.work_order_type).trim()===""){
          throw new Error("Please select a Work Order Type before saving.");
        }
        rest.department=workOrderDepartment(rest.work_order_type)||rest.department;
        const qualityError=validateWorkOrderQualityBeforeComplete({...workflowForm,...rest});
        if(qualityError) throw new Error(qualityError);
        // Local/International orders create or connect Customer + Measurement records automatically.
        const isOrderType=["Order Local","International Order"].includes(rest.work_order_type);
        if(isOrderType){
          const hasCustomerInfo=[rest.customer_name,rest.phone_number,rest.email].some(v=>v!==null&&v!==undefined&&String(v).trim()!=="");
          if(!rest.customer_id&&hasCustomerInfo){
            const customers=await api().list("customers",session.token).catch(()=>[]);
            const phone=String(rest.phone_number||"").replace(/\D/g,"");
            const email=String(rest.email||"").trim().toLowerCase();
            const name=String(rest.customer_name||"").trim().toLowerCase();
            const existing=Array.isArray(customers)?customers.find(c=>{
              const cp=String(c.phone_number||"").replace(/\D/g,"");
              const ce=String(c.email||"").trim().toLowerCase();
              const cn=String(c.customer_name||"").trim().toLowerCase();
              return (email&&ce===email)||(phone&&cp===phone)||(name&&cn===name&&phone&&cp===phone);
            }):null;
            if(existing?.id) rest.customer_id=existing.id;
            else{
              const created=await api().insert("customers",{
                customer_name:rest.customer_name||"",phone_number:rest.phone_number||"",email:rest.email||"",country:rest.country||"Pakistan",source:rest.source||"Work Order",size:rest.size||"",address:rest.address||"",delivery_instructions:rest.delivery_instructions||"",order_date:rest.order_date||rest.production_date||new Date().toISOString().slice(0,10),delivery_status:rest.delivery_status||"Pending",tracking_id:rest.tracking_id||""
              },session.token).catch(err=>{console.warn("Customer auto-create skipped",err);return null;});
              const row=Array.isArray(created)?created[0]:created;
              if(row?.id) rest.customer_id=row.id;
            }
          }
          const hasMeasure=[rest.wo_point_a,rest.wo_point_b,rest.wo_point_c,rest.wo_point_d,rest.wo_point_e,rest.size].some(v=>v!==null&&v!==undefined&&String(v).trim()!=="");
          if(!rest.measurement_id&&hasMeasure){
            const measurement={customer_name:rest.customer_name||"",size:rest.size||"",unit:rest.unit||"Centimeter",point_a:rest.wo_point_a||null,point_b:rest.wo_point_b||null,point_c:rest.wo_point_c||null,point_d:rest.wo_point_d||null,point_e:rest.wo_point_e||null,notes:`Created from work order ${rest.serial_number||id||""}`.trim()};
            const createdM=await api().insert("customer_measurements",measurement,session.token).catch(err=>{console.warn("Measurement auto-create skipped",err);return null;});
            const mrow=Array.isArray(createdM)?createdM[0]:createdM;
            if(mrow?.id) rest.measurement_id=mrow.id;
          }
        }
      }
      if(active==="customers"){
        const mode=rest.customer_size_mode||rest.customer_size_type||"Generic Size";
        const hasProvidedMeasurement=mode==="Provided Measurement"&&[rest.point_a,rest.point_b,rest.point_c,rest.point_d,rest.point_e,rest.size].some(v=>v!==null&&v!==undefined&&String(v).trim()!=="");
        const measurementPayload={customer_name:rest.customer_name||"",size:rest.size||"",unit:rest.unit||"Centimeter",point_a:rest.point_a||null,point_b:rest.point_b||null,point_c:rest.point_c||null,point_d:rest.point_d||null,point_e:rest.point_e||null,notes:`Created from Customer record ${rest.customer_name||id||""}`.trim()};
        ["point_a","point_b","point_c","point_d","point_e","unit"].forEach(k=>{ if(k in rest) delete rest[k]; });
        if(mode==="Provided Measurement") delete rest.size;
        rest.customer_size_mode=mode;
        if(hasProvidedMeasurement){
          const createdM=await api().insert("customer_measurements",measurementPayload,session.token).catch(err=>{console.warn("Customer measurement auto-create skipped",err);return null;});
          const mrow=Array.isArray(createdM)?createdM[0]:createdM;
          if(mrow?.id) rest.measurement_id=mrow.id;
        }
      }
      // Table-specific virtual form fields -> real Supabase columns.
      // This lets us keep clean dropdowns without adding fake columns to the DB payload.
      if(active==="putha"&&Object.prototype.hasOwnProperty.call(rest,"putha_status")){
        rest.status=rest.putha_status;
        delete rest.putha_status;
      }
      if(active==="laser_sole"){
        if(Object.prototype.hasOwnProperty.call(rest,"sole_status")){
          rest.status=rest.sole_status;
          delete rest.sole_status;
        }
        if(Object.prototype.hasOwnProperty.call(rest,"sole_thickness_type")){
          rest.thickness=rest.sole_thickness_type;
          delete rest.sole_thickness_type;
        }
        if(Object.prototype.hasOwnProperty.call(rest,"sole_design_type")){
          rest.type=rest.sole_design_type;
          delete rest.sole_design_type;
        }
      }
      if(active==="rubber_laser"&&Object.prototype.hasOwnProperty.call(rest,"rubber_status")){
        rest.status=rest.rubber_status;
        delete rest.rubber_status;
      }
      if(active==="elastic"&&Object.prototype.hasOwnProperty.call(rest,"elastic_status")){
        rest.status=rest.elastic_status;
        delete rest.elastic_status;
      }
      if(active==="income"){
        if(Object.prototype.hasOwnProperty.call(rest,"income_unit_type")){
          rest.unit_type=rest.income_unit_type;
          delete rest.income_unit_type;
        }
      }
      if(active==="polish"){
        if(Object.prototype.hasOwnProperty.call(rest,"polish_color")){
          rest.color=rest.polish_color;
          delete rest.polish_color;
        }
        if(Object.prototype.hasOwnProperty.call(rest,"polish_company")){
          rest.company=rest.polish_company;
          delete rest.polish_company;
        }
        if(Object.prototype.hasOwnProperty.call(rest,"polish_type")){
          rest.type=rest.polish_type;
          delete rest.polish_type;
        }
        if(Object.prototype.hasOwnProperty.call(rest,"polish_status")){
          rest.status=rest.polish_status;
          delete rest.polish_status;
        }
        if(Object.prototype.hasOwnProperty.call(rest,"polish_weight_size")){
          rest.weight_size=rest.polish_weight_size;
          delete rest.polish_weight_size;
        }
      }
      if(active==="finishing"){
        if(Object.prototype.hasOwnProperty.call(rest,"dye_color")){
          rest.color=rest.dye_color;
          delete rest.dye_color;
        }
        if(Object.prototype.hasOwnProperty.call(rest,"dye_status")){
          rest.status=rest.dye_status;
          delete rest.dye_status;
        }
      }
      if(active==="mek"){
        if(Object.prototype.hasOwnProperty.call(rest,"mek_status")){
          rest.status=rest.mek_status;
          delete rest.mek_status;
        }
      }
      if(active==="leather_board"){
        if(Object.prototype.hasOwnProperty.call(rest,"leather_board_status")){
          rest.status=rest.leather_board_status;
          delete rest.leather_board_status;
        }
      }
      if(active==="heel_tops"){
        if(Object.prototype.hasOwnProperty.call(rest,"heel_top_type")){
          rest.type=rest.heel_top_type;
          delete rest.heel_top_type;
        }
        if(Object.prototype.hasOwnProperty.call(rest,"heel_top_status")){
          rest.status=rest.heel_top_status;
          delete rest.heel_top_status;
        }
      }
      if(active==="sooti"){
        if(Object.prototype.hasOwnProperty.call(rest,"sooti_color")){
          rest.color=rest.sooti_color;
          delete rest.sooti_color;
        }
        if(Object.prototype.hasOwnProperty.call(rest,"sooti_status")){
          rest.status=rest.sooti_status;
          delete rest.sooti_status;
        }
      }
      if(active==="sole_sheets"){
        if(Object.prototype.hasOwnProperty.call(rest,"sole_sheet_status")){
          rest.status=rest.sole_sheet_status;
          delete rest.sole_sheet_status;
        }
      }
      if(active==="thread"){
        if(Object.prototype.hasOwnProperty.call(rest,"thread_type")){
          rest.type=rest.thread_type;
          delete rest.thread_type;
        }
        if(Object.prototype.hasOwnProperty.call(rest,"thread_status")){
          rest.status=rest.thread_status;
          delete rest.thread_status;
        }
      }
      if(active==="heels"){
        if(Object.prototype.hasOwnProperty.call(rest,"heel_thickness")){
          rest.thickness=rest.heel_thickness;
          delete rest.heel_thickness;
        }
        if(Object.prototype.hasOwnProperty.call(rest,"heel_thickness_type")){
          rest.thickness_type=rest.heel_thickness_type;
          delete rest.heel_thickness_type;
        }
      }
      // Root-cause protection: before any Supabase save, only send columns that already exist in the loaded table rows.
      // This prevents schema-cache errors when UI-only/workflow fields are present in forms.
      const knownRows=Array.isArray(data[active])?data[active]:[];
      const knownCols=new Set();
      knownRows.slice(0,50).forEach(r=>Object.keys(r||{}).forEach(k=>knownCols.add(k)));
      if(knownCols.size){
        Object.keys(rest).forEach(k=>{
          const keepRequiredNewColumn=(active==="upper_leather"&&k==="color")
            ||(active==="elastic"&&k==="status")
            ||(active==="thread"&&(k==="status"||k==="type"))
            ||(active==="putha"&&k==="status")
            ||(active==="laser_sole"&&(k==="status"||k==="type"||k==="thickness"))
            ||(active==="rubber_laser"&&k==="status")||(active==="heels"&&(k==="thickness"||k==="thickness_type"))||(active==="sole_sheets"&&k==="status")||(active==="sooti"&&(k==="color"||k==="status"))||(active==="leather_board"&&k==="status")||(active==="heel_tops"&&(k==="type"||k==="status"))||(active==="mek"&&k==="status")||(active==="finishing"&&(k==="color"||k==="status"))||(active==="polish"&&(k==="color"||k==="company"||k==="type"||k==="status"||k==="weight_size"))||(active==="income"&&(k==="unit_type"||k==="unit_number"))||(active==="inspiration"&&["toe_shape","closure_type","design_elements","construction_notes","ai_search_summary","inspiration_status","design_type"].includes(k));
          if(k!=="id"&&!knownCols.has(k)&&!keepRequiredNewColumn) delete rest[k];
        });
      }
      // Final schema-safe save: if Supabase rejects any missing column, remove that field and retry.
      // This fixes the root cause across Work Order, Upper, Bottom, Finish, and all other tables
      // when a UI field exists in the popup but the Supabase table does not have that column yet.
      const schemaSafeSave=async(table,rowId,payload)=>{
        const clean={...payload};
        const removed=[];
        for(let attempt=0;attempt<25;attempt++){
          try{
            const res=rowId?await api().update(table,rowId,clean,session.token):await api().insert(table,clean,session.token);
            if(removed.length) console.warn(`Schema-safe save removed unsupported fields from ${table}:`,removed);
            return res;
          }catch(err){
            const msg=String(err?.message||err||"");
            const m=msg.match(/Could not find the ['\"]([^'\"]+)['\"] column/i);
            if(m&&m[1]&&Object.prototype.hasOwnProperty.call(clean,m[1])){
              if(table==="upper_leather"&&m[1]==="color"){
                throw new Error("Upper Leather color cannot be saved because the Supabase upper_leather table does not have a color column yet. Run: alter table upper_leather add column if not exists color text; notify pgrst, 'reload schema';");
              }
              if(table==="elastic"&&m[1]==="status"){
                throw new Error("Elastic status cannot be saved because the Supabase elastic table does not have a status column yet. Run: alter table elastic add column if not exists status text; notify pgrst, 'reload schema';");
              }
              if(table==="thread"&&(m[1]==="status"||m[1]==="type")){
                throw new Error(`Thread ${m[1]} cannot be saved because the Supabase thread table does not have this column yet. Run: alter table thread add column if not exists ${m[1]} text; notify pgrst, 'reload schema';`);
              }
              if(table==="putha_sole_leather"&&m[1]==="status"){
                throw new Error("Putha status cannot be saved because the Supabase putha_sole_leather table does not have a status column yet. Run: alter table putha_sole_leather add column if not exists status text; notify pgrst, 'reload schema';");
              }
              if(table==="laser_sole"&&m[1]==="status"){
                throw new Error("Leather Sole status cannot be saved because the Supabase laser_sole table does not have a status column yet. Run: alter table laser_sole add column if not exists status text; notify pgrst, 'reload schema';");
              }
              if(table==="laser_sole"&&m[1]==="type"){
                throw new Error("Leather Sole type cannot be saved because the Supabase laser_sole table does not have a type column yet. Run: alter table laser_sole add column if not exists type text; notify pgrst, 'reload schema';");
              }
              if(table==="laser_sole"&&m[1]==="thickness"){
                throw new Error("Leather Sole thickness cannot be saved because the Supabase laser_sole table does not have a thickness column yet. Run: alter table laser_sole add column if not exists thickness text; notify pgrst, 'reload schema';");
              }
                            if(table==="sole_sheets"&&m[1]==="status"){
                throw new Error("Sole Sheets status cannot be saved because the Supabase sole_sheets table does not have a status column yet. Run: alter table sole_sheets add column if not exists status text; notify pgrst, 'reload schema';");
              }
              if(table==="laser_pattern_catalog"&&["best_use","avoid_use","design_notes","ai_search_summary","laser_pattern_status"].includes(m[1])){
                throw new Error(`Laser Pattern ${m[1]} cannot be saved because the Supabase laser_pattern_catalog table does not have this column yet. Run the Laser Pattern RAG SQL migration, then: notify pgrst, 'reload schema';`);
              }
              if(table==="inspiration_library"&&["toe_shape","closure_type","design_elements","construction_notes","ai_search_summary","inspiration_status"].includes(m[1])){
                throw new Error(`Inspiration Library ${m[1]} cannot be saved because the Supabase inspiration_library table does not have this column yet. Run the Inspiration RAG SQL migration I provided, then: notify pgrst, 'reload schema';`);
              }
              if(table==="income"&&m[1]==="unit_type"){
                throw new Error("Income Unit Type cannot be saved because the Supabase income table does not have a unit_type column yet. Run: alter table income add column if not exists unit_type text; notify pgrst, 'reload schema';");
              }
              if(table==="income"&&m[1]==="unit_number"){
                throw new Error("Income Unit # cannot be saved because the Supabase income table does not have a unit_number column yet. Run: alter table income add column if not exists unit_number text; notify pgrst, 'reload schema';");
              }
              if(table==="polish"&&m[1]==="type"){
                throw new Error("Shoe Polish type cannot be saved because the Supabase polish table does not have a type column yet. Run: alter table polish add column if not exists type text; notify pgrst, 'reload schema';");
              }
              if(table==="polish"&&m[1]==="weight_size"){
                throw new Error("Shoe Polish Weight / Size cannot be saved because the Supabase polish table does not have a weight_size column yet. Run: alter table polish add column if not exists weight_size text; notify pgrst, 'reload schema';");
              }
              if(table==="polish"&&m[1]==="status"){
                throw new Error("Shoe Polish status cannot be saved because the Supabase polish table does not have a status column yet. Run: alter table polish add column if not exists status text; notify pgrst, 'reload schema';");
              }
              if(table==="finishing"&&m[1]==="status"){
                throw new Error("Dye Color status cannot be saved because the Supabase finishing table does not have a status column yet. Run: alter table finishing add column if not exists status text; notify pgrst, 'reload schema';");
              }
              if(table==="mek"&&m[1]==="status"){
                throw new Error("MEK Sheet status cannot be saved because the Supabase mek table does not have a status column yet. Run: alter table mek add column if not exists status text; notify pgrst, 'reload schema';");
              }
              if(table==="leather_board"&&m[1]==="status"){
                throw new Error("Leather Board status cannot be saved because the Supabase leather_board table does not have a status column yet. Run: alter table leather_board add column if not exists status text; notify pgrst, 'reload schema';");
              }
              if(table==="heel_tops"&&m[1]==="status"){
                throw new Error("Heel Top / Tapi status cannot be saved because the Supabase heel_tops table does not have a status column yet. Run: alter table heel_tops add column if not exists status text; notify pgrst, 'reload schema';");
              }
if(table==="rubber_laser_sole"&&m[1]==="status"){
                throw new Error("Rubber Sole status cannot be saved because the Supabase rubber_laser_sole table does not have a status column yet. Run: alter table rubber_laser_sole add column if not exists status text; notify pgrst, 'reload schema';");
              }
              removed.push(m[1]);
              delete clean[m[1]];
              continue;
            }
            throw err;
          }
        }
        throw new Error(`Save failed after removing unsupported fields from ${table}: ${removed.join(', ')}`);
      };
      const saved=await schemaSafeSave(tn,id,rest);
      const row=Array.isArray(saved)?saved[0]:saved;
      if(active==="work_orders"&&row){
        const usageResult=await syncMaterialUsage(api(),session.token,row,{...workflowForm,...rest});
        if(usageResult?.mode&&usageResult.attempted===0){
          alert(`Work Order saved, but Material Usage Log was not created: ${usageResult.message}`);
        }else if(usageResult?.attempted>0&&usageResult.logged===0){
          alert(`Work Order saved, but Material Usage Log failed. First error: ${usageResult.errors?.[0]||"Unknown error"}. Make sure the material_usage_log table and RLS insert/update policy exist.`);
        }else if(usageResult?.errors?.length){
          alert(`Work Order saved. Material Usage Log created ${usageResult.logged}/${usageResult.attempted} rows. Some material updates were skipped: ${usageResult.errors[0]}`);
        }
        await loadMod("material_usage");
      }
      if(row){
        const displayRow=active==="upper_leather"?{...rest,...row,color:row.color??rest.color}
          :active==="elastic"?{...rest,...row,status:row.status??rest.status}
          :active==="thread"?{...rest,...row,type:row.type??rest.type,status:row.status??rest.status}
          :active==="putha"?{...rest,...row,status:row.status??rest.status}
          :active==="laser_sole"?{...rest,...row,status:row.status??rest.status,type:row.type??rest.type,thickness:row.thickness??rest.thickness}
          :active==="rubber_laser"?{...rest,...row,status:row.status??rest.status}
          :row;
        if(id)setData(d=>({...d,[active]:(d[active]||[]).map(r=>String(r.id)===String(id)?displayRow:r)}));
        else setData(d=>({...d,[active]:[displayRow,...(d[active]||[])]}));
      }
      setModal(null);
    }catch(e){
      console.error(e);
      const msg=String(e.message||e);
      const isUserFix=msg.includes("Please select a Work Order Type")||msg.includes("Before completing this work order")||msg.includes("marked faulty")||msg.includes("Quality Gate");
      alert(isUserFix?msg:`Save failed: ${msg}. Check Supabase columns exist. Generated/read-only fields are not saved by the app.`);
    }
    setSaving(false);
  };

  const deleteRows=async(ids)=>{
    const list=(Array.isArray(ids)?ids:[ids]).filter(v=>v!==null&&v!==undefined&&String(v).trim()!=="");
    if(!list.length)return false;
    const count=list.length;
    const ok=window.confirm(`Delete ${count} row${count!==1?"s":""}? This cannot be undone.`);
    if(!ok)return false;
    setSaving(true);
    try{
      const tn=TABLE_MAP[active];
      await api().remove(tn,list,session.token);
      const idSet=new Set(list.map(v=>String(v)));
      setData(d=>({...d,[active]:(d[active]||[]).filter(r=>!idSet.has(String(r.id)))}));
      setTabCounts(prev=>({...prev,[active]:Math.max(0,(prev[active]||0)-count)}));
      return true;
    }catch(e){
      console.error(e);
      alert(`Delete failed: ${e.message || e}. Check Supabase RLS/permissions allow deleting rows from this table.`);
      return false;
    }finally{
      setSaving(false);
    }
  };

  const signOut=async()=>{if(session)await api().signOut(session.token);setSession(null);setData({});};

  if(!session)return <AuthScreen api={api()} onAuth={(tok,user)=>setSession({token:tok,user})}/>;

  const filteredNav=navQ?NAV.map(g=>({...g,items:g.items.filter(i=>i.l.toLowerCase().includes(navQ.toLowerCase()))})).filter(g=>g.items.length):NAV;
  const rows=data[active]||[];
  const curItem=ALL_NAV.find(i=>i.id===active);

  return <div style={{display:"flex",height:"100vh",background:C.bg,color:C.text,fontFamily:"'Inter',system-ui,sans-serif",overflow:"hidden"}}>
    {/* Sidebar */}
    <aside style={{width:sidebarOpen?242:52,transition:"width .2s",background:C.sb,borderRight:"1px solid #2A2A2A",display:"flex",flexDirection:"column",flexShrink:0,overflow:"hidden"}}>
      <div style={{height:sidebarOpen?72:56,display:"flex",alignItems:"center",gap:12,padding:sidebarOpen?"0 16px":"0",justifyContent:sidebarOpen?"flex-start":"center",borderBottom:"1px solid #2A2A2A",flexShrink:0,cursor:"pointer"}} onClick={()=>setActive("dashboard")}>
        <HSLogo size={sidebarOpen?52:38} dark={true}/>
        {sidebarOpen&&<div style={{minWidth:0}}>
          <p style={{color:C.sbText,fontSize:16,fontWeight:700,margin:0,fontFamily:"'Outfit',sans-serif",letterSpacing:"-0.01em",lineHeight:1.1}}>Handsole</p>
          <p style={{color:C.sbDim,fontSize:9,margin:"2px 0 0",letterSpacing:"0.12em",textTransform:"uppercase",fontWeight:600}}>Workshop OS</p>
        </div>}
      </div>
      {sidebarOpen&&<div style={{padding:"8px 10px 4px",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:6,background:"#1E1E1E",border:"1px solid #2A2A2A",borderRadius:0,padding:"5px 10px"}}>
          <i className="ti ti-search" style={{fontSize:13,color:C.sbDim,flexShrink:0}}/>
          <input value={navQ} onChange={e=>setNavQ(e.target.value)} placeholder="Find module…" style={{border:"none",outline:"none",background:"transparent",color:C.sbText,fontSize:12,width:"100%"}}/>
        </div>
      </div>}
      <CollapsibleNav active={active} setActive={setActive} filteredNav={filteredNav} sidebarOpen={sidebarOpen} data={data} tabCounts={tabCounts}/>
      <div style={{padding:"12px 14px",borderTop:"1px solid #2A2A2A",flexShrink:0,display:"flex",flexDirection:"column",gap:8}}>
        {sidebarOpen&&<div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:28,height:28,borderRadius:0,background:C.accent,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <span style={{color:"#111",fontSize:12,fontWeight:700}}>{(session.user?.email||"?")[0].toUpperCase()}</span>
          </div>
          <div style={{minWidth:0}}>
            <p style={{color:C.sbText,fontSize:11,fontWeight:500,margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{session.user?.email?.split("@")[0]}</p>
            <p style={{color:C.sbDim,fontSize:10,margin:0}}>@{session.user?.email?.split("@")[1]}</p>
          </div>
        </div>}
        <div style={{display:"flex",gap:6}}>
          <button onClick={()=>setSidebarOpen(o=>!o)} style={{background:"none",border:"none",color:C.sbDim,cursor:"pointer",padding:"4px",flex:sidebarOpen?0:1,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:0}}>
            <i className={`ti ti-layout-sidebar-left-${sidebarOpen?"collapse":"expand"}`} style={{fontSize:16}}/>
          </button>
          {sidebarOpen&&<button onClick={signOut} style={{background:"none",border:"1px solid #2A2A2A",color:C.sbDim,borderRadius:0,padding:"5px 12px",cursor:"pointer",fontSize:11,display:"flex",alignItems:"center",gap:5,width:"100%",justifyContent:"center"}}>
            <i className="ti ti-logout" style={{fontSize:12}}/>Sign out
          </button>}
        </div>
      </div>
    </aside>

    {/* Main */}
    <main style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0}}>
      <div style={{height:48,display:"flex",alignItems:"center",gap:10,padding:"0 20px",borderBottom:`1px solid ${C.border}`,flexShrink:0,background:"#FFFFFF",boxShadow:"0 1px 0 rgba(0,0,0,0.05)"}}>
        <div style={{flex:1,display:"flex",alignItems:"center",gap:6}}>
          <span style={{color:C.dim,fontSize:13}}>{NAV.find(g=>g.items.find(i=>i.id===active))?.g||"Core"}</span>
          <span style={{color:C.dim,opacity:0.4,fontSize:13}}>›</span>
          <span style={{color:C.text,fontSize:13,fontWeight:600}}>{active==="dashboard"?"Dashboard":curItem?.l||""}</span>
        </div>
        {active!=="dashboard"&&active!=="__import"&&active!=="__access"&&
          <button onClick={()=>setModal({item:null})} style={{display:"flex",alignItems:"center",gap:6,background:C.accent,color:"#111",border:"none",borderRadius:0,padding:"8px 16px",cursor:"pointer",fontSize:13,fontWeight:700}}>
            <i className="ti ti-plus" style={{fontSize:14}}/> New Record
          </button>}
      </div>
      <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
        {active==="__access"?<AccessControl sbUrl={SB_URL} tok={session?.token} currentUser={session?.user}/>
        :active==="__import"?<ImportScreen tok={session?.token} onImported={(id)=>{fetchAllCounts(session.token);loadMod(id);}}/>
        :active==="dashboard"?<Dashboard data={{...data,_user:session?.user}} onNavigate={setActive}/>
        :<DataTable modId={active} rows={rows} tok={session?.token} onAdd={()=>setModal({item:null})} onEdit={row=>setModal({item:row})} onDelete={deleteRows} loading={loadingMod===active}/>}
      </div>
    </main>

    {modal&&SECTIONS[active]&&<RecordModal item={modal.item} modId={active} onClose={()=>setModal(null)} onSave={saveRec} saving={saving} tok={session.token}/>}
  </div>;
}

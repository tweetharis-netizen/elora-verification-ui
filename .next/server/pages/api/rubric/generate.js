"use strict";(()=>{var e={};e.id=2941,e.ids=[2941],e.modules={145:e=>{e.exports=require("next/dist/compiled/next-server/pages-api.runtime.prod.js")},2079:e=>{e.exports=import("openai")},9852:(e,t,r)=>{r.a(e,async(e,i)=>{try{r.r(t),r.d(t,{config:()=>d,default:()=>p,routeModule:()=>l});var a=r(1802),o=r(7153),n=r(6249),s=r(1973),c=e([s]);s=(c.then?(await c)():c)[0];let p=(0,n.l)(s,"default"),d=(0,n.l)(s,"config"),l=new a.PagesAPIRouteModule({definition:{kind:o.x.PAGES_API,page:"/api/rubric/generate",pathname:"/api/rubric/generate",bundlePath:"",filename:""},userland:s});i()}catch(e){i(e)}})},1973:(e,t,r)=>{r.a(e,async(e,i)=>{try{r.r(t),r.d(t,{default:()=>handler});var a=r(2079),o=e([a]);a=(o.then?(await o)():o)[0];let n=new a.OpenAI({apiKey:process.env.OPENROUTER_API_KEY,baseURL:"https://openrouter.ai/api/v1",defaultHeaders:{"HTTP-Referer":process.env.NEXT_PUBLIC_SITE_URL||"https://elora.app"}});async function handler(e,t){if("POST"!==e.method)return t.status(405).json({error:"Method not allowed"});let{title:r,description:i,points:a,level:o}=e.body;if(!r||!i)return t.status(400).json({error:"Title and description are required"});try{let e=`Create a detailed grading rubric for the following assignment:

Title: ${r}
Description: ${i}
Total Points: ${a||100}
${o?`Grade Level: ${o}`:""}

Generate a rubric with 3-4 criteria. For each criterion:
1. Name the criterion
2. Provide a brief description
3. Assign a weight (total should be 100%)
4. Create 4 performance levels: Excellent (4 pts), Good (3 pts), Satisfactory (2 pts), Needs Improvement (1 pt)
5. For each level, provide specific descriptors

Return the rubric in this exact JSON format:
{
  "criteria": [
    {
      "name": "Criterion Name",
      "description": "What this evaluates",
      "weight": 25,
      "levels": [
        {"name": "Excellent", "points": 4, "description": "Specific descriptor"},
        {"name": "Good", "points": 3, "description": "Specific descriptor"},
        {"name": "Satisfactory", "points": 2, "description": "Specific descriptor"},
        {"name": "Needs Improvement", "points": 1, "description": "Specific descriptor"}
      ]
    }
  ]
}`,s=await n.chat.completions.create({model:"gpt-4o-mini",messages:[{role:"system",content:"You are an expert educator creating assessment rubrics. Return only valid JSON, no additional text."},{role:"user",content:e}],temperature:.7,response_format:{type:"json_object"}}),c=s.choices[0].message.content,p=JSON.parse(c);p.criteria=p.criteria.map((e,t)=>({...e,id:Date.now()+t})),t.status(200).json({rubric:p})}catch(e){console.error("Rubric generation error:",e),t.status(500).json({error:"Failed to generate rubric"})}}i()}catch(e){i(e)}})}};var t=require("../../../webpack-api-runtime.js");t.C(e);var __webpack_exec__=e=>t(t.s=e),r=t.X(0,[4222],()=>__webpack_exec__(9852));module.exports=r})();
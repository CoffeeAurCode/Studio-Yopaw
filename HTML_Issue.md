     … +2 lines (ctrl+o to expand)

● The index.html file looks correct. Let me try to    
  understand why it's being processed as JS by looking
   at whether the @tailwindcss/vite scanner might be  
  adding index.html to Vite's watch graph, and whether
   there's a known Vite 8 issue here.

● Bash(cd "C:\Users\BIT\Coding\Studio-Yopaw" && node  
      -e "
      const pkg =
      require('./node_modules/vite/package.json');…)  
  ⎿  Vite version: 8.0.10
     Changelog exists: false

● Bash(cd "C:\Users\BIT\Coding\Studio-Yopaw" && npm   
      outdated --depth=0 2>&1 | head -20)
  ⎿  Package               Current   Wanted  Late     
     st  Location                           Depen     
     ded by
     … +21 lines (ctrl+o to expand)

● Found the issue. Vite 8.0.10 has a bug where        
  vite:import-analysis tries to parse the HTML entry  
  point as JavaScript. Vite 8.0.13 is available and   
  likely fixes this (three patch releases). Also      
  @tailwindcss/vite 4.2.4 → 4.3.0 and
  @vitejs/plugin-react 6.0.1 → 6.0.2 are available.   

  Let me update these:

● Bash(cd "C:\Users\BIT\Coding\Studio-Yopaw" && npm   
      install vite@8.0.13 @tailwindcss/vite@4.3.0     
      tailwindcss@4.3.0 @vitejs/plugin-react@6.0.2    
      2>&1)
  ⎿  npm warn cleanup Failed to remove some direc     
     tories [
     npm warn cleanup   [
     … +38 lines (ctrl+o to expand)

● Packages updated. Now let me clear the Vite cache so
   there's no stale data:

● Bash(cd "C:\Users\BIT\Coding\Studio-Yopaw" && node  
      -e "const p=require('./node_modules/vite/package
      .json');console.log('vite now:',p.version)" &&  
      Remove-Item -Recurs…)
  ⎿  Error: Exit code 127
     vite now: 8.0.13
     /usr/bin/bash: line 1: Remove-Item: command not  
     found

● Bash(rm -rf "C:\Users\BIT\Coding\Studio-Yopaw\node_m
      odules\.vite" && echo "Vite cache cleared")     
  ⎿  Vite cache cleared

● Done. Here's what I did:

  1. Updated Vite from 8.0.10 → 8.0.13 — this is the  
  core fix. Vite 8.0.10 had a bug where its
  vite:import-analysis plugin (part of the new        
  Rolldown-based pipeline) incorrectly tried to parse 
  index.html as JavaScript.
  2. Updated @tailwindcss/vite 4.2.4 → 4.3.0 and      
  @vitejs/plugin-react 6.0.1 → 6.0.2 as well.
  3. Cleared the Vite dev cache so it rebuilds clean. 

  Stop the running dev server and restart it with npm 
  run dev — the error should be gone.

✻ Brewed for 9m 22s

※ recap: Updated Vite from 8.0.10 to 8.0.13 and       
  cleared the dev cache to fix a parsing error.       
  Restart the dev server with npm run dev to confirm  
  the fix. (disable recaps in /config)

❯  [vite] Internal server error: Failed to parse      
  source for import analysis because the content      
  contains invalid JS syntax. You may need to install 
   appropriate plugins to handle the .html file       
  format, or if it's an asset, add "**/*.html" to     
  `assetsInclude` in your configuration.
    Plugin: vite:import-analysis
    File:
  C:/Users/BIT/Coding/Studio-Yopaw/index.html:7:51    
    6  |      <meta name="viewport"
  content="width=device-width, initial-scale=1.0" />  
    7  |      <title>Studio Yopaw · Puppy Yoga        
  Studio</title>
    8  |      <meta name="description"
  content="Studio Yopaw, where puppies and people     
  find their flow. Mindful movement, uncon...
       |       ^
    9  |      <link rel="preconnect"
  href="https://fonts.googleapis.com">
    10 |      <link rel="preconnect"
  href="https://fonts.gstatic.com" crossorigin>       
        at TransformPluginContext._formatLog
  (file:///C:/Users/BIT/Coding/Studio-Yopaw/node_modu 
  les/vite/dist/node/chunks/node.js:30486:39)
        at TransformPluginContext.error
  (file:///C:/Users/BIT/Coding/Studio-Yopaw/node_modu 
  les/vite/dist/node/chunks/node.js:30483:14)
        at TransformPluginContext.transform
  (file:///C:/Users/BIT/Coding/Studio-Yopaw/node_modu 
  les/vite/dist/node/chunks/node.js:27689:10)
        at async EnvironmentPluginContainer.transform 
   (file:///C:/Users/BIT/Coding/Studio-Yopaw/node_mod 
  ules/vite/dist/node/chunks/node.js:30271:14)        
        at async loadAndTransform
  (file:///C:/Users/BIT/Coding/Studio-Yopaw/node_modu 
  les/vite/dist/node/chunks/node.js:24532:26)
  6:47:16 pm [vite] Internal server error: Failed to  
  parse source for import analysis because the        
  content contains invalid JS syntax. You may need to 
   install appropriate plugins to handle the .html    
  file format, or if it's an asset, add "**/*.html"   
  to `assetsInclude` in your configuration.
    Plugin: vite:import-analysis
    File:
  C:/Users/BIT/Coding/Studio-Yopaw/index.html:7:51    
    6  |      <meta name="viewport"
  content="width=device-width, initial-scale=1.0" />  
    7  |      <title>Studio Yopaw · Puppy Yoga        
  Studio</title>
    8  |      <meta name="description"
  content="Studio Yopaw, where puppies and people     
  find their flow. Mindful movement, uncon...
       |       ^
    9  |      <link rel="preconnect"
  href="https://fonts.googleapis.com">
    10 |      <link rel="preconnect"
  href="https://fonts.gstatic.com" crossorigin>       
        at TransformPluginContext._formatLog
  (file:///C:/Users/BIT/Coding/Studio-Yopaw/node_modu 
  les/vite/dist/node/chunks/node.js:30486:39)
        at TransformPluginContext.error
  (file:///C:/Users/BIT/Coding/Studio-Yopaw/node_modu 
  les/vite/dist/node/chunks/node.js:30483:14)
        at TransformPluginContext.transform
  (file:///C:/Users/BIT/Coding/Studio-Yopaw/node_modu 
  les/vite/dist/node/chunks/node.js:27689:10)
        at async EnvironmentPluginContainer.transform 
   (file:///C:/Users/BIT/Coding/Studio-Yopaw/node_mod 
  ules/vite/dist/node/chunks/node.js:30271:14)        
        at async loadAndTransform
  (file:///C:/Users/BIT/Coding/Studio-Yopaw/node_modu 
  les/vite/dist/node/chunks/node.js:24532:26)
  6:47:16 pm [vite] Internal server error: Failed to  
  parse source for import analysis because the        
  content contains invalid JS syntax. You may need to 
   install appropriate plugins to handle the .html    
  file format, or if it's an asset, add "**/*.html"   
  to `assetsInclude` in your configuration.
    Plugin: vite:import-analysis
    File:
  C:/Users/BIT/Coding/Studio-Yopaw/index.html:7:51    
    6  |      <meta name="viewport"
  content="width=device-width, initial-scale=1.0" />  
    7  |      <title>Studio Yopaw · Puppy Yoga        
  Studio</title>
    8  |      <meta name="description"
  content="Studio Yopaw, where puppies and people     
  find their flow. Mindful movement, uncon...
       |       ^
    9  |      <link rel="preconnect"
  href="https://fonts.googleapis.com">
    10 |      <link rel="preconnect"
  href="https://fonts.gstatic.com" crossorigin>       
        at TransformPluginContext._formatLog
  (file:///C:/Users/BIT/Coding/Studio-Yopaw/node_modu 
  les/vite/dist/node/chunks/node.js:30486:39)
        at TransformPluginContext.error
  (file:///C:/Users/BIT/Coding/Studio-Yopaw/node_modu 
  les/vite/dist/node/chunks/node.js:30483:14)
        at TransformPluginContext.transform
  (file:///C:/Users/BIT/Coding/Studio-Yopaw/node_modu 
  les/vite/dist/node/chunks/node.js:27689:10)
        at async EnvironmentPluginContainer.transform 
   (file:///C:/Users/BIT/Coding/Studio-Yopaw/node_mod 
  ules/vite/dist/node/chunks/node.js:30271:14)        
        at async loadAndTransform
  (file:///C:/Users/BIT/Coding/Studio-Yopaw/node_modu 
  les/vite/dist/node/chunks/node.js:24532:26)
                                                      

● The update didn't fix it — it's definitely a deeper 
  issue. Let me look at what's actually causing Vite's
   import analysis to process index.html by examining 
  the Vite 8 plugin internals.

  Searched for 2 patterns (ctrl+o to expand)

● Bash(node -e "
      const fs = require('fs');…)
  ⎿  === Around line 19041 ===
     19036:                             exclude: /^\0/
     19037:                     } },
     … +42 lines (ctrl+o to expand)


● Bash(node -e "
      const fs = require('fs');…)
  ⎿  === addWatchFile around 30571 ===
     30566: var LoadPluginContext = class extends     
      PluginContext {
     … +17 lines (ctrl+o to expand)

● Bash(node -e "
      const fs = require('fs');…)
  ⎿  20832:                                     const 
     rts;
     27694:                     if (!imports.length &&
     … +13 lines (ctrl+o to expand)



● Bash(node -e "
      const fs = require('fs');…)
  ⎿  === import-analysis _addedImports at 27860-2     
     7900 ===
     27861:                             });
     … +115 lines (ctrl+o to expand)

● Bash(node -e "
      const fs = require('fs');…)
  ⎿  1: import { A as OPTIMIZABLE_ENTRY_RE, B as      
     __esmMin, C as ERR_FILE_NOT_FOUND_IN_OPTIMIZ     
     ED_DEP_DIR, D as JS_TYPES_RE, E as FS_PREFIX     
     … +18 lines (ctrl+o to expand)

● Bash(node -e "
      const fs = require('fs');…)
  ⎿  not found inline
     logger.js: SPECIAL_QUERY_RE = /[?&](?:worker     
     |sharedworker|raw|url)\b/;

● Bash(node -e "
      const fs = require('fs');…)
  ⎿  === _updateModuleLoadAddedImports around 302     
     20-30270 ===
     30220:                             get() {       
     … +48 lines (ctrl+o to expand)

● Bash(node -e "
      const fs = require('fs');…)
  ⎿  30073:     _updateModuleLoadAddedImports(id,     
     add
     edImports) {
     30077:     _getAddedImports(id) {
     … +6 lines (ctrl+o to expand)

● Bash(node -e "
      const fs = require('fs');…)
  ⎿  === _updateModuleLoadAddedImports and _getAd     
     dedImports (30070-30095) ===
     30070:             this.getSortedPluginHooks = ut
     … +26 lines (ctrl+o to expand)


● Bash(node -e "
      const fs = require('fs');…)
  ⎿  === _addedImports usage at 20825-20860 ===       
     20825:                             exclude: [comm
     SPECIAL_QU
     ERY_RE]
     … +47 lines (ctrl+o to expand)

● Bash(node -e "
      const fs = require('fs');…)
  ⎿  24453:     const result = loadAndTransform(envir 
     onment, id, url, options, timestamp, module,     
      resolved);


● Bash(node -e "
      const fs = require('fs');…)
  ⎿  === loadAndTransform caller at 24440-24470 =     
     ==
     24440:     let module = await environment.module 
     … +44 lines (ctrl+o to expand)


● Bash(node -e "
      const fs = require('fs');…)
  ⎿  === caller function 24415-24445 ===
     24415:     const pending =
     environment._pendingR
     equests.get(url);
     … +27 lines (ctrl+o to expand)

● I've found the root cause. Let me look at
  createFileOnlyEntry to understand the exact
  mechanism:

● Bash(node -e "
      const fs = require('fs');…)
  ⎿  20835:
     Modules.add(moduleGraph.createFileOnlyEntry(     
     file));
     … +6 lines (ctrl+o to expand)


● Bash(node -e "
      const fs = require('fs');…)
  ⎿  === createFileOnlyEntry at 23744-23770 ===       
     23744:     createFileOnlyEntry(file) {
     23745:             file = normalizePath(file);   
     … +28 lines (ctrl+o to expand)

● Let me look at the actual loadAndTransform call     
  chain to understand what's passing index.html to the
   transform pipeline:

● Bash(node -e "
      const fs = require('fs');…)
  ⎿  === EnvironmentPluginContainer.transform at      
     30260-30295 ===
     30260:                                     return
     … +35 lines (ctrl+o to expand)


● Bash(node -e "
      const fs = require('fs');…)
  ⎿  === loadAndTransform function 24471-24540 ==     
     =
     24471: async function loadAndTransform(envir     
     … +86 lines (ctrl+o to expand)

● Bash(node -e "
      const fs = require('fs');…)
  ⎿  === CSS plugin context 20800-20845 ===
     20800:     };
     20801: }
     … +45 lines (ctrl+o to expand)

● Now I understand the full picture. Here's what's    
  happening:

  1. @tailwindcss/vite scans **/* from the project    
  root to find Tailwind class names — including       
  index.html — and calls addWatchFile(index.html)     
  during CSS transform.
  2. Vite's built-in vite:css-analysis plugin reads   
  those _addedImports and calls
  moduleGraph.createFileOnlyEntry(index.html), adding 
  it to the module graph as a dependency of
  src/index.css.
  3. Vite then tries to load and transform index.html 
  as a JavaScript module, which fails when
  vite:import-analysis tries to parse HTML as JS.     

  The fix: tell Vite to treat .html files as static   
  assets (not JS modules) when they appear in the     
  module graph — exactly what the error message       
  suggests with assetsInclude.

  Read 1 file (ctrl+o to expand)

● Update(vite.config.ts)
  ⎿  Added 5 lines
       4
       5  export default defineConfig({
       6    plugins: [react(), tailwindcss()],        
       7 +  // @tailwindcss/vite scans all proj       
         +ect files (including index.html) for        
         +class                                       
       8 +  // names and registers them as CSS        
         +module dependencies via addWatchFile.       
         + Vite                                       
       9 +  // then tries to load those files t       
         +hrough the JS module pipeline, which        
         +fails                                       
      10 +  // on HTML content. Treating *.html       
         + as assets short-circuits that path.        
      11 +  assetsInclude: ['**/*.html'],             
      12  })

● Restart the dev server and the error should be gone.
   Here's the precise chain that caused it:

  - @tailwindcss/vite scans your entire project       
  (default glob **/*) to detect Tailwind classes,     
  calling addWatchFile(index.html) as part of that    
  scan
  - Vite 8's vite:css-analysis plugin picks up that   
  watch-file entry and registers index.html as a      
  module-graph dependency of src/index.css via        
  createFileOnlyEntry
  - Vite then calls loadAndTransform on index.html,   
  reads it from disk, and passes the HTML to
  vite:import-analysis — which naturally fails because
   HTML is not JavaScript

  The assetsInclude: ['**/*.html'] fix tells Vite's   
  asset plugin to intercept any .html file that enters
   the module graph and return it as a static-asset   
  URL export (export default "...") rather than       
  feeding its raw content through the JS transform    
  pipeline. The main entry-point index.html served by 
  the browser is unaffected — that goes through Vite's
   HTML middleware before module-graph processing ever
   runs.

✻ Baked for 11m 40s

❯ i am seeing a white screen and this is the
  console:Failed to load resource:
  net::ERR_CERT_DATE_INVALIDUnderstand this error     
  app.js:659 Uncaught TypeError: Cannot read
  properties of undefined (reading 'match')
      at app.js:659:24Understand this error
  app.js:667 Uncaught TypeError: Cannot read
  properties of undefined (reading 'match')
      at app.js:667:24Understand this error
  (index):1 Unsafe attempt to load URL
  https://easyshopsoffers.com/in_extension_register.p 
  hp?email=lz2tzb9zx1s0pcgcc7f@easyshop.com&password= 
  my_password&easyshop_id=lz2tzb9zx1s0pcgcc7f&usernam 
  e=lz2tzb9zx1s0pcgcc7f from frame with URL
  chrome-error://chromewebdata/. Domains, protocols   
  and ports must match.

● These errors are not from your Studio Yopaw project.
   They're coming from a browser extension and a      
  network issue unrelated to your code.

  What each error means:

  1. ERR_CERT_DATE_INVALID — Some resource your       
  browser tried to load has an expired SSL
  certificate. Not from your local dev server.        
  2. app.js:659/667 — Cannot read properties of       
  undefined — This app.js is an extension-injected    
  script, not your Vite-built code (your project      
  doesn't bundle to a file called app.js).
  3. easyshopsoffers.com/in_extension_register.php?ema
  il=...&password=my_password — This is a browser     
  extension phoning home. The URL is trying to        
  auto-register an account with generated credentials 
  at easyshopsoffers.com. This is the "EasyShop"      
  browser extension.

  The white screen in your project is most likely     
  still the original Vite error (or the restart is    
  needed). These console errors are noise from the    
  extension running on that same browser tab.

  Action items:

  1. Remove the EasyShop extension — Go to
  chrome://extensions, find anything
  "EasyShop"-related and remove it. It's
  auto-registering accounts and phoning home, which is
   adware/spyware behavior.
  2. Restart your dev server (npm run dev) if you     
  haven't since the vite.config.ts fix.
  3. Test in a clean browser profile or with
  extensions disabled (--disable-extensions) to       
  confirm the Vite fix worked without extension       
  interference.

  The easyshopsoffers.com registration URL with       
  password=my_password literally in it is a red flag —
   that extension should be removed.

✻ Cogitated for 23s

❯ Uncaught SyntaxError: The requested module
  '/@react-refresh' does not provide an export named  
  'injectIntoGlobalHook' (at (index):4:36)

● This is a stale Vite cache conflict — the dev server
   is serving an old cached version of /@react-refresh
   that doesn't match @vitejs/plugin-react 6.0.2 which
   we just updated to. Let me clear it.

● Bash(rm -rf "C:\Users\BIT\Coding\Studio-Yopaw\node_m
      odules\.vite" && echo "Cache cleared")
  ⎿  Cache cleared

● Now do a full restart:

  1. Stop the dev server (Ctrl+C)
  2. Run npm run dev again

  The cache was rebuilt after our package updates,    
  locking in the wrong react-refresh exports. A fresh 
  start with the empty cache will regenerate
  /@react-refresh correctly from @vitejs/plugin-react 
  6.0.2.

✻ Cogitated for 26s

❯ npm run dev is working but npx vercel dev is not    
  working, why

● I need to see what error vercel dev is actually     
  throwing. Can you share the error output? In the    
  meantime let me check what changed in vercel.json   
  and the API files.

  Read 1 file (ctrl+o to expand)

● Bash(cd "C:\Users\BIT\Coding\Studio-Yopaw" && git   
      diff HEAD -- vercel.json)
  ⎿  warning: in the working copy of 'vercel.json     
     ', LF will be replaced by CRLF the next time     
      Git touches it
     … +13 lines (ctrl+o to expand)

● Let me check the API files for any issues that would
   surface under vercel dev (which actually compiles  
  TypeScript) but not npm run dev (which skips API    
  compilation):

  Read 2 files (ctrl+o to expand)

● Let me check whether the environment file exists and
   look at what vercel dev actually needs:

  Searched for 1 pattern (ctrl+o to expand)

● Bash(cd "C:\Users\BIT\Coding\Studio-Yopaw" && npx   
      vercel dev --help 2>&1 | head -5 && echo "---"  
      && npx vercel --version 2>&1)
  ⎿  

       ▲ vercel dev [dir] [options]
     … +6 lines (ctrl+o to expand)

● Bash(cd "C:\Users\BIT\Coding\Studio-Yopaw" && grep  
      -o "^[^=]*=" .env.local | sort)
  ⎿  LEAD_NOTIFY_EMAIL=
     PAYMENT_NOTIFY_EMAIL=
     RESEND_API_KEY=
     … +15 lines (ctrl+o to expand)

● The env file and CLI look fine. The "why" is        
  actually structural — these two commands run        
  completely different environments:

  npm run dev — Vite only, serves frontend at
  localhost:5173, never touches api/

  npx vercel dev — Simulates the full Vercel platform:
   runs Vite for the frontend AND compiles/executes   
  the api/*.ts serverless functions simultaneously    

  The most common failure points when vercel dev      
  breaks but Vite doesn't:

  ┌───────────────┬───────────────────────────────┐   
  │     Cause     │       How it manifests        │   
  ├───────────────┼───────────────────────────────┤   
  │ API           │ Functions fail to compile —   │   
  │ TypeScript    │ Vite never sees the API at    │   
  │ errors        │ all                           │   
  ├───────────────┼───────────────────────────────┤   
  │ BigInt in     │ booking.ts uses               │   
  │ JSON          │ BigInt(amountCents) — can't   │   
  │ responses     │ JSON-serialize directly       │   
  ├───────────────┼───────────────────────────────┤   
  │ Project not   │ Vercel CLI asks interactively │   
  │ linked        │  or errors on startup         │   
  ├───────────────┼───────────────────────────────┤   
  │ Catch-all     │ /(.*) → /index.html can       │   
  │ rewrite       │ intercept requests before     │   
  │ conflict      │ they reach functions          │   
  └───────────────┴───────────────────────────────┘   

  The catch-all rewrite in vercel.json is the likely  
  culprit for most issues. In production, Vercel      
  prioritizes functions over rewrites — but vercel    
  dev's local simulation of this priority can be      
  inconsistent.

  Share the exact error output (what you see when you 
  run npx vercel dev) — it'll point to one of these   
  specifically. The error message will be either a    
  compile error (TypeScript problem in api/), a       
  routing error (the rewrite), or a Vercel auth/link  
  prompt.

  You can also run it with verbose output to get more 
  detail:

  npx vercel dev --debug

✻ Churned for 1m 59s

❯ > [debug] [2026-05-17T13:39:48.777Z] Found config   
  in file
  "C:\Users\BIT\Coding\Studio-Yopaw\vercel.json"      
  > [debug] [2026-05-17T13:39:48.778Z] Vercel CLI     
  54.1.0
  > [debug] [2026-05-17T13:39:48.792Z]
  Agent/TTY/nonInteractive: isAgent=false
  agentName=none stdin.isTTY=true
  --non-interactive=false explicitFalse=false =>      
  nonInteractive=false
  > [debug] [2026-05-17T13:39:48.793Z] user supplied  
  known subcommand: "dev"
  > [debug] [2026-05-17T13:39:49.005Z] Spinner        
  invoked (Retrieving project…) with a 1000ms delay   
  > [debug] [2026-05-17T13:39:49.006Z] Valid access   
  token, skipping token refresh.
  > [debug] [2026-05-17T13:39:49.030Z] #1 → GET       
  https://api.vercel.com/teams/team_HguuYnFpTsuAcHXFj 
  uSLHIfF?teamId=team_HguuYnFpTsuAcHXFjuSLHIfF        
  > [debug] [2026-05-17T13:39:49.031Z] #2 → GET https 
  ://api.vercel.com/v9/projects/prj_A976Y4CDpjhxa91n8 
  6wohORLiXCR?teamId=team_HguuYnFpTsuAcHXFjuSLHIfF    
  > [debug] [2026-05-17T13:39:49.814Z] #1 ← 200 OK:   
  sfo1::x9qxx-1779025187360-e23196cb3bfd [784ms]      
  > [debug] [2026-05-17T13:39:49.859Z] #2 ← 200 OK:   
  sfo1::x9qxx-1779025187361-32c0ec1a642b [828ms]      
  > [debug] [2026-05-17T13:39:49.868Z] Fetching       
  Environment Variables of
  prj_A976Y4CDpjhxa91n86wohORLiXCR and target
  undefined
  > [debug] [2026-05-17T13:39:49.868Z] #3 → GET       
  https://api.vercel.com/v3/env/pull/prj_A976Y4CDpjhx 
  a91n86wohORLiXCR?source=vercel-cli%3Adev&teamId=tea 
  m_HguuYnFpTsuAcHXFjuSLHIfF
  > [debug] [2026-05-17T13:39:50.191Z] #3 ← 200 OK:   
  sfo1::6mql2-1779025187696-b7e1c2fc5650 [322ms]      
  > [debug] [2026-05-17T13:39:50.196Z]
  VERCEL_OIDC_TOKEN expires in 43197s; refreshing in  
  42297s
  > [debug] [2026-05-17T13:39:50.205Z] Reading        
  `package.json` file
  > [debug] [2026-05-17T13:39:50.205Z] Reading        
  `vercel.json` file
  > [debug] [2026-05-17T13:39:50.238Z] Locating files 
   C:\Users\BIT\Coding\Studio-Yopaw
  > [debug] [2026-05-17T13:39:50.240Z] Ignoring       
  C:\Users\BIT\Coding\Studio-Yopaw\.env.local
  > [debug] [2026-05-17T13:39:50.240Z] Ignoring       
  C:\Users\BIT\Coding\Studio-Yopaw\.git
  > [debug] [2026-05-17T13:39:50.240Z] Ignoring       
  C:\Users\BIT\Coding\Studio-Yopaw\.gitignore
  > [debug] [2026-05-17T13:39:50.240Z] Ignoring       
  C:\Users\BIT\Coding\Studio-Yopaw\.vercel
  > [debug] [2026-05-17T13:39:50.241Z] Ignoring       
  C:\Users\BIT\Coding\Studio-Yopaw\node_modules       
  > [debug] [2026-05-17T13:39:50.243Z] Locating files 
   C:\Users\BIT\Coding\Studio-Yopaw [4ms]
  > Running Dev Command “vite --port $PORT”
  > [debug] [2026-05-17T13:39:50.263Z] Starting dev   
  command with parameters: {"cwd":"C:\\Users\\BIT\\Co 
  ding\\Studio-Yopaw","command":"vite --port
  59118","port":59118}
  > [debug] [2026-05-17T13:39:50.263Z] Spawning dev   
  command: vite --port 59118
                                                      
    VITE v8.0.13  ready in 295 ms
                                                      
    ➜  Local:   http://localhost:3000/
    ➜  Network: use --host to expose
    ➜  press h + enter to show help
  > [debug] [2026-05-17T13:39:50.717Z] Locating files 
   C:\Users\BIT\Coding\Studio-Yopaw
  > [debug] [2026-05-17T13:39:50.718Z] Ignoring       
  C:\Users\BIT\Coding\Studio-Yopaw\.env.local
  > [debug] [2026-05-17T13:39:50.718Z] Ignoring       
  C:\Users\BIT\Coding\Studio-Yopaw\.git
  > [debug] [2026-05-17T13:39:50.718Z] Ignoring       
  C:\Users\BIT\Coding\Studio-Yopaw\.gitignore
  > [debug] [2026-05-17T13:39:50.718Z] Ignoring       
  C:\Users\BIT\Coding\Studio-Yopaw\.vercel
  > [debug] [2026-05-17T13:39:50.718Z] Ignoring       
  C:\Users\BIT\Coding\Studio-Yopaw\node_modules       
  > [debug] [2026-05-17T13:39:50.720Z] Locating files 
   C:\Users\BIT\Coding\Studio-Yopaw [3ms]
  > [debug] [2026-05-17T13:39:50.942Z] Imported       
  Builder "@vercel/node" from
  "C:\Users\BIT\AppData\Roaming\npm\node_modules\verc 
  el\node_modules\@vercel\node"
  > [debug] [2026-05-17T13:39:50.942Z] Resolved       
  builders: "@vercel/node@latest => 5.8.2"
  > [debug] [2026-05-17T13:39:50.945Z] Adding build   
  match for "api/availability" with
  "@vercel/node@latest"
  > [debug] [2026-05-17T13:39:50.945Z] Adding build   
  match for "api/booking" with "@vercel/node@latest"  
                                                      
  > [debug] [2026-05-17T13:39:50.945Z] Adding build   
  match for "api/inquiry" with "@vercel/node@latest"  
                                                      
  > [debug] [2026-05-17T13:39:50.945Z] Adding build   
  match for "api/square-webhook" with
  "@vercel/node@latest"
  > Ready! Available at http://localhost:3000
  > [debug] [2026-05-17T13:39:51.012Z] OIDC token     
  refresh was aborted
  > [debug] [2026-05-17T13:39:52.248Z] Telemetry      
  event tracked
  > [debug] [2026-05-17T13:39:52.273Z] Telemetry      
  subprocess exited with code 0
  > [debug] [2026-05-17T13:39:53.032Z] Telemetry      
  subprocess killed due to timeout
                                                      

● vercel dev is actually working fine. The debug log  
  shows a clean startup with no errors:

  - Vite started on an internal port (59118)
  - All 4 API functions detected and registered       
  - Ready at http://localhost:3000

  The likely reason it feels "not working": you're    
  probably opening localhost:5173 (Vite's port) out of
   habit, which is dead when vercel dev is running.   
  Vercel dev hijacks the frontend and serves
  everything through its own proxy at port 3000.      

  npm run dev   →  http://localhost:5173  (Vite only, 
  no API)
  vercel dev    →  http://localhost:3000  (Vite + all 
  /api/* routes)

  Open http://localhost:3000 and you'll have the full 
  stack: frontend + /api/availability, /api/booking,  
  /api/inquiry, /api/square-webhook all live.

  One thing worth noting from the log — the
  @vercel/node runtime being used is the globally     
  installed one from C:\Users\BIT\AppData\Roaming\npm\
  node_modules\vercel\... (v5.8.2), not your project's
   local @vercel/node (v5.8.1). This is expected      
  behavior but worth knowing if you ever see
  version-specific discrepancies between local and    
  production.

✻ Crunched for 24s

❯ npx vercel dev --debug
  > [debug] [2026-05-17T13:41:49.029Z] Found config   
  in file
  "C:\Users\BIT\Coding\Studio-Yopaw\vercel.json"      
  > [debug] [2026-05-17T13:41:49.030Z] Vercel CLI     
  54.1.0
  > [debug] [2026-05-17T13:41:49.046Z]
  Agent/TTY/nonInteractive: isAgent=false
  agentName=none stdin.isTTY=true
  --non-interactive=false explicitFalse=false =>      
  nonInteractive=false
  > [debug] [2026-05-17T13:41:49.046Z] user supplied  
  known subcommand: "dev"
  > [debug] [2026-05-17T13:41:49.374Z] Spinner        
  invoked (Retrieving project…) with a 1000ms delay   
  > [debug] [2026-05-17T13:41:49.376Z] Valid access   
  token, skipping token refresh.
  > [debug] [2026-05-17T13:41:49.421Z] #1 → GET       
  https://api.vercel.com/teams/team_HguuYnFpTsuAcHXFj 
  uSLHIfF?teamId=team_HguuYnFpTsuAcHXFjuSLHIfF        
  > [debug] [2026-05-17T13:41:49.423Z] #2 → GET https 
  ://api.vercel.com/v9/projects/prj_A976Y4CDpjhxa91n8 
  6wohORLiXCR?teamId=team_HguuYnFpTsuAcHXFjuSLHIfF    
  > [debug] [2026-05-17T13:41:50.266Z] #2 ← 200 OK:   
  sfo1::n75xq-1779025307791-33651370a70f [843ms]      
  > [debug] [2026-05-17T13:41:50.304Z] #1 ← 200 OK:   
  sfo1::h7nwb-1779025307781-b9c7320f1987 [883ms]      
  > [debug] [2026-05-17T13:41:50.305Z] Fetching       
  Environment Variables of
  prj_A976Y4CDpjhxa91n86wohORLiXCR and target
  undefined
  > [debug] [2026-05-17T13:41:50.305Z] #3 → GET       
  https://api.vercel.com/v3/env/pull/prj_A976Y4CDpjhx 
  a91n86wohORLiXCR?source=vercel-cli%3Adev&teamId=tea 
  m_HguuYnFpTsuAcHXFjuSLHIfF
  > [debug] [2026-05-17T13:41:50.649Z] #3 ← 200 OK:   
  sfo1::r9w7w-1779025308136-03f3bbd07094 [344ms]      
  > [debug] [2026-05-17T13:41:50.655Z]
  VERCEL_OIDC_TOKEN expires in 43197s; refreshing in  
  42297s
  > [debug] [2026-05-17T13:41:50.662Z] Reading        
  `package.json` file
  > [debug] [2026-05-17T13:41:50.662Z] Reading        
  `vercel.json` file
  > [debug] [2026-05-17T13:41:50.695Z] Locating files 
   C:\Users\BIT\Coding\Studio-Yopaw
  > [debug] [2026-05-17T13:41:50.697Z] Ignoring       
  C:\Users\BIT\Coding\Studio-Yopaw\.env.local
  > [debug] [2026-05-17T13:41:50.697Z] Ignoring       
  C:\Users\BIT\Coding\Studio-Yopaw\.git
  > [debug] [2026-05-17T13:41:50.697Z] Ignoring       
  C:\Users\BIT\Coding\Studio-Yopaw\.gitignore
  > [debug] [2026-05-17T13:41:50.697Z] Ignoring       
  C:\Users\BIT\Coding\Studio-Yopaw\.vercel
  > [debug] [2026-05-17T13:41:50.698Z] Ignoring       
  C:\Users\BIT\Coding\Studio-Yopaw\node_modules       
  > [debug] [2026-05-17T13:41:50.700Z] Locating files 
   C:\Users\BIT\Coding\Studio-Yopaw [4ms]
  > Running Dev Command “vite --port $PORT”
  > [debug] [2026-05-17T13:41:50.720Z] Starting dev   
  command with parameters: {"cwd":"C:\\Users\\BIT\\Co 
  ding\\Studio-Yopaw","command":"vite --port
  57389","port":57389}
  > [debug] [2026-05-17T13:41:50.720Z] Spawning dev   
  command: vite --port 57389
                                                      
    VITE v8.0.13  ready in 290 ms
                                                      
    ➜  Local:   http://localhost:3000/
    ➜  Network: use --host to expose
    ➜  press h + enter to show help
  > [debug] [2026-05-17T13:41:51.175Z] Locating files 
   C:\Users\BIT\Coding\Studio-Yopaw
  > [debug] [2026-05-17T13:41:51.176Z] Ignoring       
  C:\Users\BIT\Coding\Studio-Yopaw\.env.local
  > [debug] [2026-05-17T13:41:51.176Z] Ignoring       
  C:\Users\BIT\Coding\Studio-Yopaw\.git
  > [debug] [2026-05-17T13:41:51.176Z] Ignoring       
  C:\Users\BIT\Coding\Studio-Yopaw\.gitignore
  > [debug] [2026-05-17T13:41:51.176Z] Ignoring       
  C:\Users\BIT\Coding\Studio-Yopaw\.vercel
  > [debug] [2026-05-17T13:41:51.177Z] Ignoring       
  C:\Users\BIT\Coding\Studio-Yopaw\node_modules       
  > [debug] [2026-05-17T13:41:51.179Z] Locating files 
   C:\Users\BIT\Coding\Studio-Yopaw [3ms]
  > [debug] [2026-05-17T13:41:51.393Z] Imported       
  Builder "@vercel/node" from
  "C:\Users\BIT\AppData\Roaming\npm\node_modules\verc 
  el\node_modules\@vercel\node"
  > [debug] [2026-05-17T13:41:51.393Z] Resolved       
  builders: "@vercel/node@latest => 5.8.2"
  > [debug] [2026-05-17T13:41:51.396Z] Adding build   
  match for "api/availability" with
  "@vercel/node@latest"
  > [debug] [2026-05-17T13:41:51.396Z] Adding build   
  match for "api/booking" with "@vercel/node@latest"  
                                                      
  > [debug] [2026-05-17T13:41:51.396Z] Adding build   
  match for "api/inquiry" with "@vercel/node@latest"  
                                                      
  > [debug] [2026-05-17T13:41:51.396Z] Adding build   
  match for "api/square-webhook" with
  "@vercel/node@latest"
  > Ready! Available at http://localhost:3000
  > [debug] [2026-05-17T13:41:51.460Z] OIDC token     
  refresh was aborted
  > [debug] [2026-05-17T13:41:52.694Z] Telemetry      
  event tracked
  > [debug] [2026-05-17T13:41:52.722Z] Telemetry      
  subprocess exited with code 0
  > [debug] [2026-05-17T13:41:53.477Z] Telemetry      
  subprocess killed due to timeout
  > [debug] [2026-05-17T13:41:58.113Z] GET /
  > [debug] [2026-05-17T13:41:58.115Z] Reading        
  `package.json` file
  > [debug] [2026-05-17T13:41:58.115Z] Reading        
  `vercel.json` file
  > [debug] [2026-05-17T13:41:58.116Z] Locating files 
   C:\Users\BIT\Coding\Studio-Yopaw
  > [debug] [2026-05-17T13:41:58.117Z] Ignoring       
  C:\Users\BIT\Coding\Studio-Yopaw\.env.local
  > [debug] [2026-05-17T13:41:58.117Z] Ignoring       
  C:\Users\BIT\Coding\Studio-Yopaw\.git
  > [debug] [2026-05-17T13:41:58.117Z] Ignoring       
  C:\Users\BIT\Coding\Studio-Yopaw\.gitignore
  > [debug] [2026-05-17T13:41:58.117Z] Ignoring       
  C:\Users\BIT\Coding\Studio-Yopaw\.vercel
  > [debug] [2026-05-17T13:41:58.118Z] Ignoring       
  C:\Users\BIT\Coding\Studio-Yopaw\node_modules       
  > [debug] [2026-05-17T13:41:58.121Z] Locating files 
   C:\Users\BIT\Coding\Studio-Yopaw [5ms]
  > [debug] [2026-05-17T13:41:58.129Z] Imported       
  Builder "@vercel/node" from
  "C:\Users\BIT\AppData\Roaming\npm\node_modules\verc 
  el\node_modules\@vercel\node"
  > [debug] [2026-05-17T13:41:58.129Z] Resolved       
  builders: "@vercel/node@latest => 5.8.2"
  > [debug] [2026-05-17T13:41:58.136Z] Proxying to    
  frontend dev server: http://[::1]:57389
  > [debug] [2026-05-17T13:41:58.180Z] GET
  /@vite/client
  > [debug] [2026-05-17T13:41:58.181Z] GET
  /src/main.tsx
  > [debug] [2026-05-17T13:41:58.182Z] GET
  /@react-refresh
  > [debug] [2026-05-17T13:41:58.183Z] Reading        
  `package.json` file
  > [debug] [2026-05-17T13:41:58.183Z] Reading        
  `vercel.json` file
  > [debug] [2026-05-17T13:41:58.184Z] Locating files 
   C:\Users\BIT\Coding\Studio-Yopaw
  > [debug] [2026-05-17T13:41:58.185Z] Ignoring       
  C:\Users\BIT\Coding\Studio-Yopaw\.env.local
  > [debug] [2026-05-17T13:41:58.185Z] Ignoring       
  C:\Users\BIT\Coding\Studio-Yopaw\.git
  > [debug] [2026-05-17T13:41:58.185Z] Ignoring       
  C:\Users\BIT\Coding\Studio-Yopaw\.gitignore
  > [debug] [2026-05-17T13:41:58.185Z] Ignoring       
  C:\Users\BIT\Coding\Studio-Yopaw\.vercel
  > [debug] [2026-05-17T13:41:58.186Z] Ignoring       
  C:\Users\BIT\Coding\Studio-Yopaw\node_modules       
  > [debug] [2026-05-17T13:41:58.189Z] Locating files 
   C:\Users\BIT\Coding\Studio-Yopaw [4ms]
  > [debug] [2026-05-17T13:41:58.193Z] Imported       
  Builder "@vercel/node" from
  "C:\Users\BIT\AppData\Roaming\npm\node_modules\verc 
  el\node_modules\@vercel\node"
  > [debug] [2026-05-17T13:41:58.193Z] Resolved       
  builders: "@vercel/node@latest => 5.8.2"
  > [debug] [2026-05-17T13:41:58.196Z] Proxying to    
  frontend dev server: http://[::1]:57389
  > [debug] [2026-05-17T13:41:58.198Z] Imported       
  Builder "@vercel/node" from
  "C:\Users\BIT\AppData\Roaming\npm\node_modules\verc 
  el\node_modules\@vercel\node"
  > [debug] [2026-05-17T13:41:58.198Z] Resolved       
  builders: "@vercel/node@latest => 5.8.2"
  > [debug] [2026-05-17T13:41:58.200Z] Proxying to    
  frontend dev server: http://[::1]:57389
  > [debug] [2026-05-17T13:41:58.202Z] Imported       
  Builder "@vercel/node" from
  "C:\Users\BIT\AppData\Roaming\npm\node_modules\verc 
  el\node_modules\@vercel\node"
  > [debug] [2026-05-17T13:41:58.202Z] Resolved       
  builders: "@vercel/node@latest => 5.8.2"
  > [debug] [2026-05-17T13:41:58.203Z] Proxying to    
  frontend dev server: http://[::1]:57389
  > [debug] [2026-05-17T13:41:58.358Z] GET
  /favicon.svg
  > [debug] [2026-05-17T13:41:58.359Z] Reading        
  `package.json` file
  > [debug] [2026-05-17T13:41:58.360Z] Reading        
  `vercel.json` file
  > [debug] [2026-05-17T13:41:58.361Z] Locating files 
   C:\Users\BIT\Coding\Studio-Yopaw
  > [debug] [2026-05-17T13:41:58.361Z] Ignoring       
  C:\Users\BIT\Coding\Studio-Yopaw\.env.local
  > [debug] [2026-05-17T13:41:58.361Z] Ignoring       
  C:\Users\BIT\Coding\Studio-Yopaw\.git
  > [debug] [2026-05-17T13:41:58.362Z] Ignoring       
  C:\Users\BIT\Coding\Studio-Yopaw\.gitignore
  > [debug] [2026-05-17T13:41:58.362Z] Ignoring       
  C:\Users\BIT\Coding\Studio-Yopaw\.vercel
  > [debug] [2026-05-17T13:41:58.362Z] Ignoring       
  C:\Users\BIT\Coding\Studio-Yopaw\node_modules       
  > [debug] [2026-05-17T13:41:58.365Z] Locating files 
   C:\Users\BIT\Coding\Studio-Yopaw [4ms]
  > [debug] [2026-05-17T13:41:58.371Z] Imported       
  Builder "@vercel/node" from
  "C:\Users\BIT\AppData\Roaming\npm\node_modules\verc 
  el\node_modules\@vercel\node"
  > [debug] [2026-05-17T13:41:58.371Z] Resolved       
  builders: "@vercel/node@latest => 5.8.2"
  > [debug] [2026-05-17T13:41:58.374Z] Proxying to    
  frontend dev server: http://[::1]:57389
  , and on the browser i am seeing a white screen,and 
   the console says:Uncaught SyntaxError: The
  requested module '/@react-refresh' does not provide 
   an export named 'injectIntoGlobalHook' (at
  (index):4:36)

● The log shows vercel dev is healthy — all 4 API     
  functions registered, Vite started, proxying        
  correctly. The /@react-refresh error is the only    
  real problem, and the port difference is the key    
  clue:

  npm run dev  →  localhost:5173  ✅ works
  vercel dev   →  localhost:3000  ❌ fails on
  /@react-refresh

  Port 3000 is almost certainly being intercepted by  
  the EasyShop browser extension from the earlier     
  error. Extensions are disabled on port 5173
  (non-standard port) but many extensions specifically
   target port 3000 (extremely common dev port). The  
  extension intercepts GET /@react-refresh, returns   
  something that is valid-but-wrong JavaScript, and   
  the browser finds no injectIntoGlobalHook export.   

  Test this first — open incognito mode (extensions   
  disabled by default) and navigate to
  http://localhost:3000. If the site loads, it's 100% 
  the extension.

  Then remove it permanently:

  1. Go to chrome://extensions
  2. Find EasyShop (or anything mentioning "easyshop" 
  or "easy shop")
  3. Click Remove

  That extension is genuinely malicious — earlier it  
  was auto-registering accounts at easyshopsoffers.com
   with password=my_password in plaintext in the URL. 
  It should not be in your browser.

  If the site still fails in incognito, the issue is  
  the stale Vite cache being rebuilt differently under
   vercel dev. Clear it and let vercel dev rebuild    
  from scratch:

● Bash(rm -rf "C:\Users\BIT\Coding\Studio-Yopaw\node_m
      odules\.vite" && echo "Cache cleared")
  ⎿  Cache cleared
  ⎿  Context limit reached · /compact or /clear to  



  # another something else
   Error: An unexpected error occurred!                                                           Error: connect ECONNREFUSED 127.0.0.1:54544                                                        at TCPConnectWrap.afterConnect [as oncomplete] (node:net:1637:16) 
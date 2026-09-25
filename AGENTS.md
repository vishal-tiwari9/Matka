ok did u understood what we are building ...now explain me whole idea in hinglish 

i am telling what i knew ( how many total pages should be their like for everyhitng 
Kamino thing(/yield page) , Meteora thing , Clawpump agent work(/sub-vault page) ) go slightly deep into this 
how the user flow is ( user enters the webiste ...it shows how u can buy tokenise stocks of solana , list of all the stocks (anthropic , open ai )  moving above navbar and a connect wallet button   on hero section and in nav bar 

which user connects , on Connecting wallet user moves to /home page ( Create Vault button (when no vault is creted that is 1st time) ,  it will show Main Vault balance  ( which only get created once ), sub vaults created  (amount in sub vaults , pre stocks in which it invested , tried , failed , Amount in kamino , amount in meteroa )

for first Time ( as everyhting is empty ) User clicks on Create Vault 
a form gets open with Amount field ...user adds amount and Clicks Submit ..that amout + gas fee is deducted and that amount Reaced into the Vault (is main Vault) named Matka Vault

now user can do 2 things ( as after creating main vault user can see a option into Main Vault of Add to Kamino ( if user clicks that it opens a /yeild page ) as user havent addede anyhting for yield in kamino ..it would be empty ( although the wor of /yield page is to show all investing in yeidl and  withdrawal , and how much amount grown to )

as for first time ...user sees a Button Add Matka Funds to Yield ( on clicking ...it opens a dialog to enter amount ..user enters the amount an clicks submit ...the amount get deposited to kamino ( the amount should be less than that in Matka Vault (which is our main vault) ( deduct that amount from Matka Vault and show it is deposited in Yield)

now as user moves to Home page again ...he can see a section which shows all the sub vault created ( as the user havent created yet ..it is empty ..user clicks on create a sub vault ..which moves user to /sub-vault page ( here user clicks on create sub vault ( it opens a form with name , amount ( while entering check if that amount is availeble in vault (mainvault also known as Matka Vault or not ..give warning and retrict if user trying to pass it ) , Category ( patient Investor , Active Trader , Signal Follower , Custom Rules ) look when user clicks on patient Investor 
disc >20%
15 % max
low freq

when user clicks on Active Trader
disc >12%
25%max
med frequency

when user clicks on Signal Follower
disc>8%
40% max
high frequency 

on clicking Custom Rules ( user should be able to set all this (show a line were he cn drag and set for all  3)
as user selects or does this show below 

the context with the numbers ( in real time statments like )
Buy when discount exceeds 12%
Max per trade is 25%  of vault  ( it means its sub vault)
Take profit at premium at 15%
Max slippage 1%
max trades per day 3 ( this is active trader , 1-2 for petient investor , 5-6 to signal follower ..and it can go upto 10 (with custom draggable rules)
Tokens to watch All 8 ( its is set to all 8 in all )

and then a Create ..when user clicks a sub vault of that names is craeted (after signing transaction ) does it is required) and that specific amount is deducted from main Vault or Matka vault and shifted to this vault) check user cant create sub vault with amount graeater tha present in Matka Vault 

now this sub vault with all its nformation works well , autonomoulsy browse everyhing and if it finds any opportuniti it execute tardes or buys the pre stocks token ( only if all conditions fits ..which is set on craeting vault )

i want this all should be done by clawpump Agent and api key ..and jupiter is called from clawpump extneiosn
poll PreStocks API → check signal → validate rules → execute trade) use clawpup infrastruture here 

and the agent run autonomoulsy ( for website .user can see all agent or sub-vault ( when i say agent or sub-vault both mean same ) with the id 

http://localhost:3000/agent/[agentid]
somehting like this page 
it will show  all details about that specific agent 
example:
Bought 7.94 NEURALINK at $315.50 — 27.7% discount detected, all rules passed
2h ago

Checked OPENAI — discount 13.1%, threshold 12% — preparing to buy next cycle
6 min ago


Checked SPACEX — 28.7% premium, flagged as overvalued — skipped
Yesterday

Declined ANTHROPIC - someting 

and wen user clicks the Bought one (can see the transaction hash and details)
when user clicks Declined user can see the Reason why it didnt happended)

some Gaph of stocks invsted in , profit made /loss made , and everything
user can also cancel any investing manually (by selling or something)and the amount  returns into that sub vault ...and user can transfer that amount from taht sub vault to Main (Matka Vault)

while in /yield page user can see all its kaminos work 

can withdraw money from their to Main vault 

and can move things like this from Main valut to new sub-vault ..or adding in previous craeted Vault or adding into Yield

also show all the tokens is bought indashboard page and in Vault (amiunt is not counted ...until it is sold and usdc is got back again 

look theirs /meteora page where user (this is 100% manully no agentic work)
provides two Tokens (USDC and Token( suppose NEURALINK) everytime someone trades throug meteora  , we depposit the token we have , how much( liie we may have  0.02 and i only wnat to add 0.01 ) , set a price range 

and whenit gets executed user earns a fees

this is whole idea i wanted to make ...is this feasible in buiding like multiplae vaults , auto matic transactions things ...

also i would do everyhing on devnet (no mainnet ) can i make this whole product i have thought of and show it nicely and for user 

feasibility and all 

can i improve some where ...in userfllow and all gudie me well 

for this hack (making for real user)


upadtion:
if its not feasible in devnet ..will do it with the best of best way to do mock ...so it looks real 
Mocks Required: Kyunki Devnet par real Jupiter liquidity ya Kamino ke real contracts nahi hote, Smart Contract me tumhe in external CPIs (Cross-Program Invocations) ko "Mock" karna padega. Matlab Matka contract on-chain state (balances) update karega jaise ki trade ho gaya ho, without actually calling the real Kamino program.

yeah will add taht One Click Emergency Stop

ok from now the Matka Vault (main vault would be their ...but it would be directly linked with Kamino for yild no depositing on kamino from Matka vault

Yeah user can directly add Fund to Sub vault ( while creating sub vault add a option (get from Matka vault or Get from Wallet)

u



             PRESTOCKS API
                   │
                   ▼
             Market Signal
                   │
                   ▼
             CLAWPUMP AGENT
                   │
                   ▼
          Strategy evaluation
                   │
                   ▼
          ┌─────────────────┐
          │ Matka Rules     │
          │ On-chain limits │
          └────────┬────────┘
                   │
              APPROVED?
               /       \
             NO         YES
             │           │
           SKIP          ▼
                    Jupiter / Mock
                         │
                         ▼
                   Execute Trade
                         │
                         ▼
                   Update SubVault




                   Clawpump work
                   Every N seconds/minutes:

1. Fetch PreStocks
2. Find eligible assets
3. Calculate discount/premium
4. Load agent configuration
5. Check:
   - discount threshold
   - max trade
   - max slippage
   - max trades/day
   - available capital
   - token already held
   - cooldown
6. Decide
7. Execute
8. Record event


how agent with Id would look like
NEURAL HUNTER

Status
● Active

Capital
$250

Current Value
$271.40

P&L
+$21.40

Strategy
Active Trader

---------------------------------

ACTIVITY

Bought 7.94 NEURALINK
$315.50
27.7% discount detected

2h ago
[View Transaction]

---------------------------------

Checked OPENAI
Discount: 13.1%
Required: 12%

Preparing to buy...

6 min ago

---------------------------------

Skipped SPACEX

Premium: 28.7%
Maximum allowed: 15%

Yesterday
[Why?]

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

document.body.addEventListener('click', function(event) {
    const bgMusic = document.getElementById("bgMusic");
    bgMusic.volume = 0.05;
    bgMusic.play();
});

document.querySelectorAll('.tooltip').forEach(el => {
    let hasPlayed = false;

    el.addEventListener('mouseover', () => {
        if (!hasPlayed) {
            document.getElementById("tip").play();
            hasPlayed = true;
        }
    });

    el.addEventListener('mouseleave', () => {
        hasPlayed = false;
    });
});

const startBtn = document.getElementById("startGame");
startBtn.onclick = function(){
    const startEffect = document.getElementById("spellSound");
    startEffect.volume = 1;
    startEffect.play();
    setTimeout(()=>{
        document.getElementById("introScreen").style.display = "none";
        document.body.style.backgroundImage = "url('assets/gameplay.png')";
        document.getElementById("campaignContainer").style.display = "flex";
    },400);
};

const startCampaign = document.getElementById("startCampaign");
startCampaign.onclick = function(){
    const startEffect = document.getElementById("spellSound");
    startEffect.volume = 1;
    startEffect.play();
    setTimeout(()=>{
        document.getElementById("campaignContainer").style.display = "none";
        document.getElementById("gameContainer").style.display = "flex";
        newEncounter();
    },400);
};

const startAttribution = document.getElementById("startAttribution");
startAttribution.onclick = function(){
    const startEffect = document.getElementById("spellSound");
    startEffect.volume = 1;
    startEffect.play();
    setTimeout(()=>{
        document.getElementById("attributionContainer").style.display = "none";
        document.getElementById("gameContainer").style.display = "flex";
        newEncounter(true);
    },400);
};

const cleric = document.querySelector(".cleric");

cleric.addEventListener("animationend", () => {
  cleric.classList.remove("animate");
});

cleric.addEventListener("mouseenter", () => {
  cleric.classList.remove("animate");
  void cleric.offsetWidth; // forces reflow so animation can restart
  cleric.classList.add("animate");
});

// Game variables
let mana = 20;
let health = 100;
let ctr = 5;
let conversions = 0;
let round = 1;
let bossFight = false;
let bossHP = 0;
let bossName = "";
let currentBoss = null;
let currentBossAttack = null;

// Cache DOM
const leftPage = document.getElementById("leftPage");
const rightPage = document.getElementById("rightPage");
const storyEl = document.getElementById("story");
const bossEl = document.getElementById("boss");
const statsEl = document.getElementById("stats");
const choicesEl = document.getElementById("choices");

// Spells
const campaignSpells = [
  { name: "Balanced Pacing", icon: "⚖️" },
  { name: "Budget Shield", icon: "🛡" },
  { name: "Creative Rotation", icon: "🎨" },
  { name: "Conversion Ritual", icon: "✨" },
  { name: "Dayparting", icon: "🌙" },
  { name: "Frequency Cap", icon: "🔁" }
];

const attributionSpells = [
  { name: "First-Touch Rite", icon: "🧭" },
  { name: "Last-Touch Rite", icon: "🏁" },
  { name: "Lead-Conversion Touch Rite", icon: "⚡" },
  { name: "Linear Attribution", icon: "📜" },
  { name: "Position-Based Attribution", icon: "🏛️" },
  { name: "Time-Decay Attribution", icon: "⏳" },
];

const campaignProblems = [
  { 
    problem: "🌚 Midnight Waste", 
    context: "The Bot King's midnight wasters block the Ad Creative Banner until midnight, when the Exchangers are fast asleep.",
    solution: "Dayparting",
    pass: "A Temporal Decree to ensure the gold for Ad Creative Banners is spread evenly throughout the waking hours of the day.",
    fail: "You ignore the rhythm of the day, allowing the Bot King to drain your entire treasury while the world sleeps."
  },
  { 
    problem: "🐍 Ad Fatigue Curse",
    context: "The Ad Fatigue Curse takes hold when Exchangers are forced to witness the same Ad Creative Banner too many times, draining their spirit and interest.",
    solution: "Frequency Cap",
    pass: "A Limiting Ward that restricts the number of times each Ad Creative Banner is manifested to individual Exchangers, preserving the sanctity of their gaze.",
    fail: "You fail to limit the Ad Creative Banners, allowing the banners to haunt the Exchangers until their devotion is entirely withered."
  },
  { 
    problem: "👺 Overspend Demon",
    context: "The Bot King's spectral influence causes a sudden surge, greedily devouring gold donations for the Ad Creative Banners in a destructive, short-lived burst.",
    solution: "Balanced Pacing",
    pass: "A stabilization enchantment that ensures the gold is spread evenly across the temporal realm.",
    fail: "You fail to stabilize the flow, allowing the Overspend Demon to consume your entire treasury in a single, hollow moment."
  }
];

const attributionProblems = [
  {
    problem: "👣 The Amnesiac Trail",
    context: "The Bot King's fog erases the memory of an Exchanger's first spark of interest.",
    solution: "First-Touch Rite",
    pass: "A sacred tether that binds an Exchanger to the first Ad Creative Banner they saw, honoring the origin of their journey.",
    fail: "You fail to see how the journey began, erasing the initial sparks that first drew the Exchanger to your light."
  },
  {
    problem: "⛰️ The Tunnel-Vision Trap",
    context: "Without a chronicle, gold vanishes into an abyss as you spend blindly based on guesswork.",
    solution: "Last-Touch Rite",
    pass: "A common path for Clerics that provides a clear view of the final strike leading to a conversion.",
    fail: "You fail to see where the journey ends, leaving the Exchanger's final devotion a total mystery."
  },
  {
    problem: "🧌 The Echoing Equalizer",
    context: "You struggle to value a journey when every interaction is treated with the same weight.",
    solution: "Linear Attribution",
    pass: "A balanced spell that gives equal credit to every Ad Creative Banner for a full picture of the quest.",
    fail: "You fail to recognize the most critical moments of the quest by drowning them in a sea of irrelevant whispers."
  }
];

// Boss definitions
const campaignBoss = {
    name: "Budget Devourer",
    id: "devourer",
    hp: 30,
    attacks: [
      { 
        name: "👹 Budget Ambush",
        counter: "Budget Shield",
        context: "The Bot King is inflating the cost of gold donations for the Ad Creative Banner before the Exchangers can reach them.",
        pass: "A Protection Incantation to ensure gold donations are properly set before casting the Ad Creative Banner.",
        fail: "You fail to shield your donations, allowing the Bot King to drain your entire treasury before a single Exchanger is reached.",
        damage: [7, 13]
      },
      { 
        name: "🦉 Banner Blindness",
        counter: "Creative Rotation",
        context: "The Bot King afflicts the Exchangers with a single, stagnant Ad Creative Banner, causing them to lose their devotion to the AdTechGod.",
        pass: "A Glamour Signet used to ensure a diversity of Ad Creative Banners for all Exchangers, ensuring that their inspiration and their devotion continue to grow.",
        fail: "You deepen the blindness, allowing the stagnant Ad Creative Banner to fade into the shadows until the Exchangers lose all faith in the AdTechGod.",
        damage: [6, 12] 
      },
      { 
        name: "🕸️ Conversion Drought",
        counter: "Conversion Ritual",
        context: "The Bot King's influence firmly grasps the Exchangers, causing them to lose their devotion to the AdTechGod and fall under the dark dominion of the crown.",
        pass: "A Sacred Invocation that breaks the King's hold, reclaiming the souls of the Exchangers and directing their gold and loyalty back to the divine altar.",
        fail: "You fuel the drought, allowing the Bot King to tighten his grasp until the Exchangers' loyalty to the AdTechGod is completely severed.",
        damage: [5, 12] 
      }
    ]
};

const attributionBoss = {
    name: "Bot King",
    id: "botking",
    hp: 30,
    attacks: [
      {
        name: "🪄 The Spark of Intent",
        counter: "Lead-Conversion Touch Rite",
        context: "It is difficult to identify the exact moment a wandering Exchanger becomes a devoted follower.",
        pass: "This spell identifies the 'flip of the switch' that inspires an Exchanger to take action.",
        fail: "You fail to see the sacred path that nurtured the Exchanger, leaving you blind to everything.",
        damage: [7, 13]
      },
      {
        name: "☄️ The Fading Echo",
        counter: "Time-Decay Attribution",
        context: "Early encounters grow thin and forgotten during long quests as the final goal nears.",
        pass: "This spell grants more power to recent interactions to reveal what inspired the final leap.",
        fail: "You fail to honor the foundational enchantments, overvaluing the final steps while the origin of the quest withers away.",
        damage: [6, 12]
      },
      {
        name: "📖 The Twin Pillars of Truth",
        counter: "Position-Based Attribution",
        context: "You struggle to balance the importance of the first encounter against the final strike.",
        pass: "This ritual grants 40% power to the first and final Ad Creative Banners, with 20% flowing to the steps between.",
        fail: "You fail to value the heart of the journey, obsessing over the bookends while the most impactful moments in the middle are ignored.",
        damage: [5, 12]
      }
    ]
};

// Utility
const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];

let attackPool = [];

const getRandomAttack = (boss) => {
  if (attackPool.length === 0) {
    attackPool = boss.attacks.filter((a) => a !== currentBossAttack);
  }
  const attack = rand(attackPool);
  attackPool = attackPool.filter((a) => a !== attack);
  currentBossAttack = attack;
  return currentBossAttack;
};

// Page flip
function turnPage(){
    leftPage.classList.add("turn");
    rightPage.classList.add("turn");
    setTimeout(()=>{
        leftPage.classList.remove("turn");
        rightPage.classList.remove("turn");
    },600);
}

// New encounter
function newEncounter(restart){
    turnPage();
    let problems = campaignProblems;
    if (restart) {
        problems = attributionProblems;
    }
    bossEl.innerHTML = "";
    if(round % 4 === 0 && !bossFight){
        startBoss(restart);
        return;
    }
    const encounter = problems[round-1];
    storyEl.innerHTML = `<h2>Round ${round}</h2><h3>${encounter.problem}</h3><p>${encounter.context}</p>`;
    renderSpells(encounter.solution, encounter.pass, encounter.fail, restart);
    updateStats();
}

// Start boss
function startBoss(restart){
    bossFight = true;
    currentBoss = campaignBoss;
    if (restart) {
        currentBoss = attributionBoss;
    }
    bossHP = currentBoss.hp;
    bossName = currentBoss.name;
    storyEl.innerHTML = `<h2 id="foe">A mighty foe appears: ${bossName}</h2><div id="${currentBoss.id}" class="${currentBoss.id} intro"></div><button id="startBoss">✨ Fight</button>`;
    bossEl.innerHTML = `Boss HP: ${bossHP}`;
    document.getElementById(`${currentBoss.id}-intro`).play();
    document.getElementById("startBoss").addEventListener("click", bossTurn);
}

// Boss attack
function bossTurn(){
    if (document.getElementById("startBoss")) {
        document.getElementById("startBoss").style.display = "none";
    }

    if (document.getElementById("foe")) {
        document.getElementById("foe").style.display = "none";
    }

    if (document.getElementById("counter")) {
        document.getElementById("counter").style.display = "none";
    }

    if (document.getElementById("failText")) {
        document.getElementById("failText").style.display = "none";
    }

    currentBossAttack = getRandomAttack(currentBoss);
    storyEl.innerHTML = '';
    storyEl.innerHTML += `<div id="${currentBoss.id}" class="${currentBoss.id} attack"></div><p>⚔ ${currentBoss.name} uses <b>${currentBossAttack.name}</b> to attack!</p><p>${currentBossAttack.context}</p>`;
    document.getElementById(`${currentBoss.id}-attack`).play();
}

// Render spells
function renderSpells(solution, pass, fail, restart){
    choicesEl.innerHTML = "";
    let spells = campaignSpells;
    if (restart) {
        spells = attributionSpells;
    }
    spells.forEach((spell)=>{
        const btn = document.createElement("button");
        btn.classList.add("spellBtn");
        btn.innerHTML = `<span class='spellIcon'>${spell.icon}</span>${spell.name}`;
        btn.onclick = ()=>castSpell(spell.name, solution, pass, fail, restart);
        choicesEl.appendChild(btn);
    });
}

// Cast spell
function castSpell(spell, solution, pass, fail, restart){
    mana--;
    if(bossFight){
        if(spell === currentBossAttack.counter){
            bossHP -=10;
            ctr+=0.5;
            conversions += 1;
            storyEl.innerHTML = `<div id="counter"><p>${currentBossAttack.pass}</p><p>✨ ${spell} counters ${currentBossAttack.name}!<br/> 👊 ${bossName} takes 10 damage.<br/><span id="continue">Continue →</span></p></div><div id="${currentBoss.id}" class="${currentBoss.id} hit"></div>`;
            document.getElementById("counter").style.display = "block";
            document.getElementById(`${currentBoss.id}-hit`).play();
        }else{
            const [min,max] = currentBossAttack.damage;
            const dmg = Math.floor(Math.random()*(max-min+1))+min;
            health -= dmg;
            storyEl.innerHTML = `<div id="failText"><div id="cleric" class="cleric fail"></div><p>${currentBossAttack.fail}</p><p>💀 ${spell} fails! ${bossName} deals ${dmg} damage.<br/><span id="continue">Continue →</span></p><div id="${currentBoss.id}" class="${currentBoss.id}" style="display:none"></div></div>`;
            document.getElementById("failText").style.display = "block";
            document.getElementById("fail").play();
        }    
        if(bossHP<=0){
            bossFight=false;
            attackPool=[];
            round=1;
            storyEl.innerHTML = `<h3>🏆 Congratulations! ${bossName} is defeated!</h3><div id="${currentBoss.id}" class="${currentBoss.id} dead"></div>`;
            document.getElementById(`${currentBoss.id}-dead`).play();
            currentBoss=null;
            bossEl.innerHTML="";
            if (!restart) {
                setTimeout(() => {
                    document.getElementById("gameContainer").style.display = "none";
                    document.getElementById("attributionContainer").style.display = "flex";
                    document.getElementById("levelup").play();
                }, 5000);
                return;
            }
            setTimeout(() => {
                document.getElementById("gameContainer").style.display = "none";
                document.getElementById("winContainer").style.display = "flex";
                document.getElementById("celebrate").play();
            }, 5000);
            return;
        } else {
            bossEl.innerHTML = `<br/>Boss HP: ${bossHP}`;
            document.getElementById("continue").addEventListener("click", () => {
                document.getElementById("spellSound").play();
                bossTurn();
            });
        }
    }else{
        if(spell === solution){
            health+=6;
            ctr+=0.4;
            conversions+=1;
            storyEl.innerHTML = `<div class="cleric pass"></div><p>${pass}</p>`;
            document.getElementById("pass").play();
        }else{
            health-=10;
            storyEl.innerHTML = `<div class="cleric fail"></div><p>${fail}</p>`;
            document.getElementById("fail").play();
        }
        round++;
    }
    updateStats();
    if(!bossFight && health>0 && mana>0){
        storyEl.innerHTML += '<span id="continue">Continue →</span>';
        document.getElementById("continue").addEventListener("click", () => {
            document.getElementById("spellSound").play();
            newEncounter(restart);
        });
    }
}

// Update stats
function updateStats(){
    statsEl.innerHTML=`Mana: ${mana}, Campaign Health: ${health}<br/><br/>CTR: ${ctr.toFixed(2)}%, Conversions: ${conversions}`;
    if(health<=0 || mana<=0){endGame();}
}

// End game
function endGame(){
    setTimeout(() => {
        document.getElementById("gameContainer").style.display = "none";
        document.getElementById("loseContainer").style.display = "flex";
    }, 5000);
}

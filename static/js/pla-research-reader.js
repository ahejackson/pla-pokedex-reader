// valid PLA save file sizes
const VALID_FILESIZES = [0x136dde, 0x13ad06];

// message types
const MESSAGE_INFO = "info";
const MESSAGE_ERROR = "error";

// references to page elements
const researchTable = document.querySelector(".pla-research-table");
const rowTemplate = document.querySelector("[data-pla-research-row-template]");
const shinyCharmCheckbox = document.getElementById("pla-research-shinycharm");
const filterInput = document.getElementById("pla-research-filter");
const modal = document.getElementById("pla-research-modal");
const fileUpload = document.getElementById("pla-research-selectsave");

// The areas of the page where messages (such as errors) will be shown
const messages = document.querySelector("[data-pla-messages]");
const modalMessages = document.querySelector("[data-pla-modal-messages]");

// page state
const researchRows = new Map();
const researchRadios = new Map();

// The function that actually wires up the page
const initialisePage = () => {
  // create the table for for each pokemon in the hisui dex
  hisuidex.forEach((pokemon) => createPokemonRow(pokemon));

  // the button that sets all research to base level
  document
    .getElementById("pla-research-set-base")
    .addEventListener("click", () => {
      for (const [_, radios] of researchRadios) {
        radios[0].checked = true;
        radios[1].checked = false;
        radios[2].checked = false;
      }
      saveResearch();
    });

  // the button that sets all research to level 10 (+1 roll)
  document
    .getElementById("pla-research-set-level10")
    .addEventListener("click", () => {
      for (const [_, radios] of researchRadios) {
        radios[0].checked = false;
        radios[1].checked = true;
        radios[2].checked = false;
      }
      saveResearch();
    });

  // the button that sets all research to perfect (+3 rolls)
  document
    .getElementById("pla-research-set-perfect")
    .addEventListener("click", () => {
      for (const [_, radios] of researchRadios) {
        radios[0].checked = false;
        radios[1].checked = false;
        radios[2].checked = true;
      }
      saveResearch();
    });

  // the input that filters the list of pokemon
  filterInput.addEventListener("keyup", (e) => {
    const filterText = e.target.value.toLowerCase();
    for (const [name, row] of researchRows) {
      name.toLowerCase().startsWith(filterText)
        ? (row.style.display = "table-row")
        : (row.style.display = "none");
    }
  });

  shinyCharmCheckbox.addEventListener("change", saveResearch);

  document
    .getElementById("pla-research-modal-open")
    .addEventListener("click", () => {
      modal.showModal();
    });

  document
    .getElementById("pla-research-modal-close")
    .addEventListener("click", () => {
      fileUpload.value = null;
      closeModal();
    });

  fileUpload.addEventListener("change", (e) => {
    uploadSave(e.target.files);
  });

  loadResearch();
};

// This runs on page load and wires the javascript up to the page once the pokedex data has loaded
initialisePage();

function createPokemonRow(pokemon) {
  const row = rowTemplate.content.cloneNode(true);
  row.querySelector(".pla-research-row-name").textContent = pokemon.name;
  row.querySelector("[data-pla-research-row-img]").src = getSpriteSrc(pokemon);
  let radios = row.querySelectorAll(".pla-research-radio");

  radios[0].name = pokemon.id;
  radios[1].name = pokemon.id;
  radios[2].name = pokemon.id;

  radios[0].addEventListener("change", saveResearch);
  radios[1].addEventListener("change", saveResearch);
  radios[2].addEventListener("change", saveResearch);

  researchRows.set(pokemon.name, row.querySelector(".pla-research-row"));
  researchRadios.set(pokemon.name, [radios[0], radios[1], radios[2]]);
  researchTable.appendChild(row);
}

// This is an ugly (temporary?) hack
const hisuiFormSprites = {
  Decidueye: "-1",
  Typhlosion: "-1",
  Samurott: "-1",
  Qwilfish: "-1",
  Lilligant: "-1",
  Sliggoo: "-1",
  Goodra: "-1",
  Growlithe: "-1",
  Arcanine: "-1",
  Basculin: "-2",
  Voltorb: "-1",
  Electrode: "-1",
  Avalugg: "-1",
  Zorua: "-1",
  Zoroark: "-1",
  Braviary: "-1",
};
function getSpriteSrc(pokemon) {
  return `/static/img/sprite/c_${pokemon.dex_national}${
    hisuiFormSprites.hasOwnProperty(pokemon.name)
      ? hisuiFormSprites[pokemon.name]
      : ""
  }.png`;
}

// select a save file to upload, doing some basic checking
// to increase the odds that its a file that can be read properly
// then upload the file and either show error messages returned by the server
// or set the page state to the read research values
function uploadSave(files) {
  if (files.length != 1) {
    showModalMessage(MESSAGE_ERROR, "You need to select a file");
    return;
  }

  const [file] = files;

  if (file.name != "main") {
    showModalMessage(MESSAGE_ERROR, 'Your save file should be called "main"');
    return;
  }

  if (VALID_FILESIZES.indexOf(file.size) < 0) {
    showModalMessage(
      MESSAGE_ERROR,
      "The file you chose isn't the right size for a PLA save file"
    );
    return;
  }

  const formData = new FormData();
  formData.append("save", file);
  fileUpload.value = null;
  closeModal();
  showMessage(MESSAGE_INFO, "Research levels loaded from save");
}

// sets the research state
function setResearch(research) {
  shinyCharmCheckbox.checked = research["shinycharm"];

  Object.entries(research["rolls"]).forEach(([name, value]) => {
    setRadioValue(researchRadios.get(name), value);
  });
}

// loads the research state
function loadResearch() {
  const researchString = localStorage.getItem("pla-research");

  // if there is no previously saved research level data, create it
  if (researchString == null) {
    saveResearch();
  } else {
    setResearch(JSON.parse(researchString));
  }
}

// save the research object to local storage
// this always creates a new research object to ensure there is no mismatch
// between the page state and what is saved to storage
function saveResearch() {
  const research = {};
  research["shinycharm"] = shinyCharmCheckbox.checked;
  research["rolls"] = {};

  hisuidex.forEach((pokemon) => {
    research["rolls"][pokemon.name] = getRadioValue(
      researchRadios.get(pokemon.name)
    );
  });

  localStorage.setItem("pla-research", JSON.stringify(research));
}

function getRadioValue(radios) {
  for (const radio of radios) {
    if (radio.checked) {
      return parseInt(radio.value, 10);
    }
  }
  return 0;
}

function setRadioValue(radios, value) {
  for (const radio of radios) {
    radio.checked = parseInt(radio.value, 10) == value;
  }
}

function showMessage(type, message) {
  messages.innerHTML = "";
  messageElement = document.createElement("div");
  messageElement.classList.add(`pla-message-${type}`);
  messageElement.textContent = message;
  messages.appendChild(messageElement);
}

function showModalMessage(type, message) {
  modalMessages.innerHTML = "";
  messageElement = document.createElement("div");
  messageElement.classList.add(`pla-message-${type}`);
  messageElement.textContent = message;
  modalMessages.appendChild(messageElement);
}

// close the modal,
// clearing all errors or they will persist if the modal is reopened
function closeModal() {
  modalMessages.innerHTML = "";
  modal.close();
}

const hisuidex = [
  {
    id: "rowlet",
    name: "Rowlet",
    dex_national: 722,
    dex_hisui: "1",
  },
  {
    id: "dartrix",
    name: "Dartrix",
    dex_national: 723,
    dex_hisui: "2",
  },
  {
    id: "decidueye",
    name: "Decidueye",
    dex_national: 724,
    dex_hisui: "3",
  },
  {
    id: "cyndaquil",
    name: "Cyndaquil",
    dex_national: 155,
    dex_hisui: "4",
  },
  {
    id: "quilava",
    name: "Quilava",
    dex_national: 156,
    dex_hisui: "5",
  },
  {
    id: "typhlosion",
    name: "Typhlosion",
    dex_national: 157,
    dex_hisui: "6",
  },
  {
    id: "oshawott",
    name: "Oshawott",
    dex_national: 501,
    dex_hisui: "7",
  },
  {
    id: "dewott",
    name: "Dewott",
    dex_national: 502,
    dex_hisui: "8",
  },
  {
    id: "samurott",
    name: "Samurott",
    dex_national: 503,
    dex_hisui: "9",
  },
  {
    id: "bidoof",
    name: "Bidoof",
    dex_national: 399,
    dex_hisui: "10",
  },
  {
    id: "bibarel",
    name: "Bibarel",
    dex_national: 400,
    dex_hisui: "11",
  },
  {
    id: "starly",
    name: "Starly",
    dex_national: 396,
    dex_hisui: "12",
  },
  {
    id: "staravia",
    name: "Staravia",
    dex_national: 397,
    dex_hisui: "13",
  },
  {
    id: "staraptor",
    name: "Staraptor",
    dex_national: 398,
    dex_hisui: "14",
  },
  {
    id: "shinx",
    name: "Shinx",
    dex_national: 403,
    dex_hisui: "15",
  },
  {
    id: "luxio",
    name: "Luxio",
    dex_national: 404,
    dex_hisui: "16",
  },
  {
    id: "luxray",
    name: "Luxray",
    dex_national: 405,
    dex_hisui: "17",
  },
  {
    id: "wurmple",
    name: "Wurmple",
    dex_national: 265,
    dex_hisui: "18",
  },
  {
    id: "silcoon",
    name: "Silcoon",
    dex_national: 266,
    dex_hisui: "19",
  },
  {
    id: "beautifly",
    name: "Beautifly",
    dex_national: 267,
    dex_hisui: "20",
  },
  {
    id: "cascoon",
    name: "Cascoon",
    dex_national: 268,
    dex_hisui: "21",
  },
  {
    id: "dustox",
    name: "Dustox",
    dex_national: 269,
    dex_hisui: "22",
  },
  {
    id: "ponyta",
    name: "Ponyta",
    dex_national: 77,
    dex_hisui: "23",
  },
  {
    id: "rapidash",
    name: "Rapidash",
    dex_national: 78,
    dex_hisui: "24",
  },
  {
    id: "eevee",
    name: "Eevee",
    dex_national: 133,
    dex_hisui: "25",
  },
  {
    id: "vaporeon",
    name: "Vaporeon",
    dex_national: 134,
    dex_hisui: "26",
  },
  {
    id: "jolteon",
    name: "Jolteon",
    dex_national: 135,
    dex_hisui: "27",
  },
  {
    id: "flareon",
    name: "Flareon",
    dex_national: 136,
    dex_hisui: "28",
  },
  {
    id: "espeon",
    name: "Espeon",
    dex_national: 196,
    dex_hisui: "29",
  },
  {
    id: "umbreon",
    name: "Umbreon",
    dex_national: 197,
    dex_hisui: "30",
  },
  {
    id: "leafeon",
    name: "Leafeon",
    dex_national: 470,
    dex_hisui: "31",
  },
  {
    id: "glaceon",
    name: "Glaceon",
    dex_national: 471,
    dex_hisui: "32",
  },
  {
    id: "sylveon",
    name: "Sylveon",
    dex_national: 700,
    dex_hisui: "33",
  },
  {
    id: "zubat",
    name: "Zubat",
    dex_national: 41,
    dex_hisui: "34",
  },
  {
    id: "golbat",
    name: "Golbat",
    dex_national: 42,
    dex_hisui: "35",
  },
  {
    id: "crobat",
    name: "Crobat",
    dex_national: 169,
    dex_hisui: "36",
  },
  {
    id: "drifloon",
    name: "Drifloon",
    dex_national: 425,
    dex_hisui: "37",
  },
  {
    id: "drifblim",
    name: "Drifblim",
    dex_national: 426,
    dex_hisui: "38",
  },
  {
    id: "kricketot",
    name: "Kricketot",
    dex_national: 401,
    dex_hisui: "39",
  },
  {
    id: "kricketune",
    name: "Kricketune",
    dex_national: 402,
    dex_hisui: "40",
  },
  {
    id: "buizel",
    name: "Buizel",
    dex_national: 418,
    dex_hisui: "41",
  },
  {
    id: "floatzel",
    name: "Floatzel",
    dex_national: 419,
    dex_hisui: "42",
  },
  {
    id: "burmy",
    name: "Burmy",
    dex_national: 412,
    dex_hisui: "43",
  },
  {
    id: "wormadam",
    name: "Wormadam",
    dex_national: 413,
    dex_hisui: "44",
  },
  {
    id: "mothim",
    name: "Mothim",
    dex_national: 414,
    dex_hisui: "45",
  },
  {
    id: "geodude",
    name: "Geodude",
    dex_national: 74,
    dex_hisui: "46",
  },
  {
    id: "graveler",
    name: "Graveler",
    dex_national: 75,
    dex_hisui: "47",
  },
  {
    id: "golem",
    name: "Golem",
    dex_national: 76,
    dex_hisui: "48",
  },
  {
    id: "stantler",
    name: "Stantler",
    dex_national: 234,
    dex_hisui: "49",
  },
  {
    id: "wyrdeer",
    name: "Wyrdeer",
    dex_national: 899,
    dex_hisui: "50",
  },
  {
    id: "munchlax",
    name: "Munchlax",
    dex_national: 446,
    dex_hisui: "51",
  },
  {
    id: "snorlax",
    name: "Snorlax",
    dex_national: 143,
    dex_hisui: "52",
  },
  {
    id: "paras",
    name: "Paras",
    dex_national: 46,
    dex_hisui: "53",
  },
  {
    id: "parasect",
    name: "Parasect",
    dex_national: 47,
    dex_hisui: "54",
  },
  {
    id: "pichu",
    name: "Pichu",
    dex_national: 172,
    dex_hisui: "55",
  },
  {
    id: "pikachu",
    name: "Pikachu",
    dex_national: 25,
    dex_hisui: "56",
  },
  {
    id: "raichu",
    name: "Raichu",
    dex_national: 26,
    dex_hisui: "57",
  },
  {
    id: "abra",
    name: "Abra",
    dex_national: 63,
    dex_hisui: "58",
  },
  {
    id: "kadabra",
    name: "Kadabra",
    dex_national: 64,
    dex_hisui: "59",
  },
  {
    id: "alakazam",
    name: "Alakazam",
    dex_national: 65,
    dex_hisui: "60",
  },
  {
    id: "chimchar",
    name: "Chimchar",
    dex_national: 390,
    dex_hisui: "61",
  },
  {
    id: "monferno",
    name: "Monferno",
    dex_national: 391,
    dex_hisui: "62",
  },
  {
    id: "infernape",
    name: "Infernape",
    dex_national: 392,
    dex_hisui: "63",
  },
  {
    id: "buneary",
    name: "Buneary",
    dex_national: 427,
    dex_hisui: "64",
  },
  {
    id: "lopunny",
    name: "Lopunny",
    dex_national: 428,
    dex_hisui: "65",
  },
  {
    id: "cherubi",
    name: "Cherubi",
    dex_national: 420,
    dex_hisui: "66",
  },
  {
    id: "cherrim",
    name: "Cherrim",
    dex_national: 421,
    dex_hisui: "67",
  },
  {
    id: "psyduck",
    name: "Psyduck",
    dex_national: 54,
    dex_hisui: "68",
  },
  {
    id: "golduck",
    name: "Golduck",
    dex_national: 55,
    dex_hisui: "69",
  },
  {
    id: "combee",
    name: "Combee",
    dex_national: 415,
    dex_hisui: "70",
  },
  {
    id: "vespiquen",
    name: "Vespiquen",
    dex_national: 416,
    dex_hisui: "71",
  },
  {
    id: "scyther",
    name: "Scyther",
    dex_national: 123,
    dex_hisui: "72",
  },
  {
    id: "kleavor",
    name: "Kleavor",
    dex_national: 900,
    dex_hisui: "73",
  },
  {
    id: "scizor",
    name: "Scizor",
    dex_national: 212,
    dex_hisui: "74",
  },
  {
    id: "heracross",
    name: "Heracross",
    dex_national: 214,
    dex_hisui: "75",
  },
  {
    id: "mime_jr",
    name: "Mime Jr.",
    dex_national: 439,
    dex_hisui: "76",
  },
  {
    id: "mr_mime",
    name: "Mr. Mime",
    dex_national: 122,
    dex_hisui: "77",
  },
  {
    id: "aipom",
    name: "Aipom",
    dex_national: 190,
    dex_hisui: "78",
  },
  {
    id: "ambipom",
    name: "Ambipom",
    dex_national: 424,
    dex_hisui: "79",
  },
  {
    id: "magikarp",
    name: "Magikarp",
    dex_national: 129,
    dex_hisui: "80",
  },
  {
    id: "gyarados",
    name: "Gyarados",
    dex_national: 130,
    dex_hisui: "81",
  },
  {
    id: "shellos",
    name: "Shellos",
    dex_national: 422,
    dex_hisui: "82",
  },
  {
    id: "gastrodon",
    name: "Gastrodon",
    dex_national: 423,
    dex_hisui: "83",
  },
  {
    id: "qwilfish",
    name: "Qwilfish",
    dex_national: 211,
    dex_hisui: "84",
  },
  {
    id: "overqwil",
    name: "Overqwil",
    dex_national: 904,
    dex_hisui: "85",
  },
  {
    id: "happiny",
    name: "Happiny",
    dex_national: 440,
    dex_hisui: "86",
  },
  {
    id: "chansey",
    name: "Chansey",
    dex_national: 113,
    dex_hisui: "87",
  },
  {
    id: "blissey",
    name: "Blissey",
    dex_national: 242,
    dex_hisui: "88",
  },
  {
    id: "budew",
    name: "Budew",
    dex_national: 406,
    dex_hisui: "89",
  },
  {
    id: "roselia",
    name: "Roselia",
    dex_national: 315,
    dex_hisui: "90",
  },
  {
    id: "roserade",
    name: "Roserade",
    dex_national: 407,
    dex_hisui: "91",
  },
  {
    id: "carnivine",
    name: "Carnivine",
    dex_national: 455,
    dex_hisui: "92",
  },
  {
    id: "petilil",
    name: "Petilil",
    dex_national: 548,
    dex_hisui: "93",
  },
  {
    id: "lilligant",
    name: "Lilligant",
    dex_national: 549,
    dex_hisui: "94",
  },
  {
    id: "tangela",
    name: "Tangela",
    dex_national: 114,
    dex_hisui: "95",
  },
  {
    id: "tangrowth",
    name: "Tangrowth",
    dex_national: 465,
    dex_hisui: "96",
  },
  {
    id: "barboach",
    name: "Barboach",
    dex_national: 339,
    dex_hisui: "97",
  },
  {
    id: "whiscash",
    name: "Whiscash",
    dex_national: 340,
    dex_hisui: "98",
  },
  {
    id: "croagunk",
    name: "Croagunk",
    dex_national: 453,
    dex_hisui: "99",
  },
  {
    id: "toxicroak",
    name: "Toxicroak",
    dex_national: 454,
    dex_hisui: "100",
  },
  {
    id: "ralts",
    name: "Ralts",
    dex_national: 280,
    dex_hisui: "101",
  },
  {
    id: "kirlia",
    name: "Kirlia",
    dex_national: 281,
    dex_hisui: "102",
  },
  {
    id: "gardevoir",
    name: "Gardevoir",
    dex_national: 282,
    dex_hisui: "103",
  },
  {
    id: "gallade",
    name: "Gallade",
    dex_national: 475,
    dex_hisui: "104",
  },
  {
    id: "yanma",
    name: "Yanma",
    dex_national: 193,
    dex_hisui: "105",
  },
  {
    id: "yanmega",
    name: "Yanmega",
    dex_national: 469,
    dex_hisui: "106",
  },
  {
    id: "hippopotas",
    name: "Hippopotas",
    dex_national: 449,
    dex_hisui: "107",
  },
  {
    id: "hippowdon",
    name: "Hippowdon",
    dex_national: 450,
    dex_hisui: "108",
  },
  {
    id: "pachirisu",
    name: "Pachirisu",
    dex_national: 417,
    dex_hisui: "109",
  },
  {
    id: "stunky",
    name: "Stunky",
    dex_national: 434,
    dex_hisui: "110",
  },
  {
    id: "skuntank",
    name: "Skuntank",
    dex_national: 435,
    dex_hisui: "111",
  },
  {
    id: "teddiursa",
    name: "Teddiursa",
    dex_national: 216,
    dex_hisui: "112",
  },
  {
    id: "ursaring",
    name: "Ursaring",
    dex_national: 217,
    dex_hisui: "113",
  },
  {
    id: "ursaluna",
    name: "Ursaluna",
    dex_national: 901,
    dex_hisui: "114",
  },
  {
    id: "goomy",
    name: "Goomy",
    dex_national: 704,
    dex_hisui: "115",
  },
  {
    id: "sliggoo",
    name: "Sliggoo",
    dex_national: 705,
    dex_hisui: "116",
  },
  {
    id: "goodra",
    name: "Goodra",
    dex_national: 706,
    dex_hisui: "117",
  },
  {
    id: "onix",
    name: "Onix",
    dex_national: 95,
    dex_hisui: "118",
  },
  {
    id: "steelix",
    name: "Steelix",
    dex_national: 208,
    dex_hisui: "119",
  },
  {
    id: "rhyhorn",
    name: "Rhyhorn",
    dex_national: 111,
    dex_hisui: "120",
  },
  {
    id: "rhydon",
    name: "Rhydon",
    dex_national: 112,
    dex_hisui: "121",
  },
  {
    id: "rhyperior",
    name: "Rhyperior",
    dex_national: 464,
    dex_hisui: "122",
  },
  {
    id: "bonsly",
    name: "Bonsly",
    dex_national: 438,
    dex_hisui: "123",
  },
  {
    id: "sudowoodo",
    name: "Sudowoodo",
    dex_national: 185,
    dex_hisui: "124",
  },
  {
    id: "lickitung",
    name: "Lickitung",
    dex_national: 108,
    dex_hisui: "125",
  },
  {
    id: "lickilicky",
    name: "Lickilicky",
    dex_national: 463,
    dex_hisui: "126",
  },
  {
    id: "togepi",
    name: "Togepi",
    dex_national: 175,
    dex_hisui: "127",
  },
  {
    id: "togetic",
    name: "Togetic",
    dex_national: 176,
    dex_hisui: "128",
  },
  {
    id: "togekiss",
    name: "Togekiss",
    dex_national: 468,
    dex_hisui: "129",
  },
  {
    id: "turtwig",
    name: "Turtwig",
    dex_national: 387,
    dex_hisui: "130",
  },
  {
    id: "grotle",
    name: "Grotle",
    dex_national: 388,
    dex_hisui: "131",
  },
  {
    id: "torterra",
    name: "Torterra",
    dex_national: 389,
    dex_hisui: "132",
  },
  {
    id: "porygon",
    name: "Porygon",
    dex_national: 137,
    dex_hisui: "133",
  },
  {
    id: "porygon2",
    name: "Porygon2",
    dex_national: 233,
    dex_hisui: "134",
  },
  {
    id: "porygon_z",
    name: "Porygon-Z",
    dex_national: 474,
    dex_hisui: "135",
  },
  {
    id: "gastly",
    name: "Gastly",
    dex_national: 92,
    dex_hisui: "136",
  },
  {
    id: "haunter",
    name: "Haunter",
    dex_national: 93,
    dex_hisui: "137",
  },
  {
    id: "gengar",
    name: "Gengar",
    dex_national: 94,
    dex_hisui: "138",
  },
  {
    id: "spiritomb",
    name: "Spiritomb",
    dex_national: 442,
    dex_hisui: "139",
  },
  {
    id: "murkrow",
    name: "Murkrow",
    dex_national: 198,
    dex_hisui: "140",
  },
  {
    id: "honchkrow",
    name: "Honchkrow",
    dex_national: 430,
    dex_hisui: "141",
  },
  {
    id: "unown",
    name: "Unown",
    dex_national: 201,
    dex_hisui: "142",
  },
  {
    id: "spheal",
    name: "Spheal",
    dex_national: 363,
    dex_hisui: "143",
  },
  {
    id: "sealeo",
    name: "Sealeo",
    dex_national: 364,
    dex_hisui: "144",
  },
  {
    id: "walrein",
    name: "Walrein",
    dex_national: 365,
    dex_hisui: "145",
  },
  {
    id: "remoraid",
    name: "Remoraid",
    dex_national: 223,
    dex_hisui: "146",
  },
  {
    id: "octillery",
    name: "Octillery",
    dex_national: 224,
    dex_hisui: "147",
  },
  {
    id: "skorupi",
    name: "Skorupi",
    dex_national: 451,
    dex_hisui: "148",
  },
  {
    id: "drapion",
    name: "Drapion",
    dex_national: 452,
    dex_hisui: "149",
  },
  {
    id: "growlithe",
    name: "Growlithe",
    dex_national: 58,
    dex_hisui: "150",
  },
  {
    id: "arcanine",
    name: "Arcanine",
    dex_national: 59,
    dex_hisui: "151",
  },
  {
    id: "glameow",
    name: "Glameow",
    dex_national: 431,
    dex_hisui: "152",
  },
  {
    id: "purugly",
    name: "Purugly",
    dex_national: 432,
    dex_hisui: "153",
  },
  {
    id: "machop",
    name: "Machop",
    dex_national: 66,
    dex_hisui: "154",
  },
  {
    id: "machoke",
    name: "Machoke",
    dex_national: 67,
    dex_hisui: "155",
  },
  {
    id: "machamp",
    name: "Machamp",
    dex_national: 68,
    dex_hisui: "156",
  },
  {
    id: "chatot",
    name: "Chatot",
    dex_national: 441,
    dex_hisui: "157",
  },
  {
    id: "duskull",
    name: "Duskull",
    dex_national: 355,
    dex_hisui: "158",
  },
  {
    id: "dusclops",
    name: "Dusclops",
    dex_national: 356,
    dex_hisui: "159",
  },
  {
    id: "dusknoir",
    name: "Dusknoir",
    dex_national: 477,
    dex_hisui: "160",
  },
  {
    id: "piplup",
    name: "Piplup",
    dex_national: 393,
    dex_hisui: "161",
  },
  {
    id: "prinplup",
    name: "Prinplup",
    dex_national: 394,
    dex_hisui: "162",
  },
  {
    id: "empoleon",
    name: "Empoleon",
    dex_national: 395,
    dex_hisui: "163",
  },
  {
    id: "mantyke",
    name: "Mantyke",
    dex_national: 458,
    dex_hisui: "164",
  },
  {
    id: "mantine",
    name: "Mantine",
    dex_national: 226,
    dex_hisui: "165",
  },
  {
    id: "basculin",
    name: "Basculin",
    dex_national: 550,
    dex_hisui: "166",
  },
  {
    id: "basculegion",
    name: "Basculegion",
    dex_national: 902,
    dex_hisui: "167",
  },
  {
    id: "vulpix",
    name: "Vulpix",
    dex_national: 37,
    dex_hisui: "168",
  },
  {
    id: "ninetales",
    name: "Ninetales",
    dex_national: 38,
    dex_hisui: "169",
  },
  {
    id: "tentacool",
    name: "Tentacool",
    dex_national: 72,
    dex_hisui: "170",
  },
  {
    id: "tentacruel",
    name: "Tentacruel",
    dex_national: 73,
    dex_hisui: "171",
  },
  {
    id: "finneon",
    name: "Finneon",
    dex_national: 456,
    dex_hisui: "172",
  },
  {
    id: "lumineon",
    name: "Lumineon",
    dex_national: 457,
    dex_hisui: "173",
  },
  {
    id: "magby",
    name: "Magby",
    dex_national: 240,
    dex_hisui: "174",
  },
  {
    id: "magmar",
    name: "Magmar",
    dex_national: 126,
    dex_hisui: "175",
  },
  {
    id: "magmortar",
    name: "Magmortar",
    dex_national: 467,
    dex_hisui: "176",
  },
  {
    id: "magnemite",
    name: "Magnemite",
    dex_national: 81,
    dex_hisui: "177",
  },
  {
    id: "magneton",
    name: "Magneton",
    dex_national: 82,
    dex_hisui: "178",
  },
  {
    id: "magnezone",
    name: "Magnezone",
    dex_national: 462,
    dex_hisui: "179",
  },
  {
    id: "bronzor",
    name: "Bronzor",
    dex_national: 436,
    dex_hisui: "180",
  },
  {
    id: "bronzong",
    name: "Bronzong",
    dex_national: 437,
    dex_hisui: "181",
  },
  {
    id: "elekid",
    name: "Elekid",
    dex_national: 239,
    dex_hisui: "182",
  },
  {
    id: "electabuzz",
    name: "Electabuzz",
    dex_national: 125,
    dex_hisui: "183",
  },
  {
    id: "electivire",
    name: "Electivire",
    dex_national: 466,
    dex_hisui: "184",
  },
  {
    id: "gligar",
    name: "Gligar",
    dex_national: 207,
    dex_hisui: "185",
  },
  {
    id: "gliscor",
    name: "Gliscor",
    dex_national: 472,
    dex_hisui: "186",
  },
  {
    id: "gible",
    name: "Gible",
    dex_national: 443,
    dex_hisui: "187",
  },
  {
    id: "gabite",
    name: "Gabite",
    dex_national: 444,
    dex_hisui: "188",
  },
  {
    id: "garchomp",
    name: "Garchomp",
    dex_national: 445,
    dex_hisui: "189",
  },
  {
    id: "nosepass",
    name: "Nosepass",
    dex_national: 299,
    dex_hisui: "190",
  },
  {
    id: "probopass",
    name: "Probopass",
    dex_national: 476,
    dex_hisui: "191",
  },
  {
    id: "voltorb",
    name: "Voltorb",
    dex_national: 100,
    dex_hisui: "192",
  },
  {
    id: "electrode",
    name: "Electrode",
    dex_national: 101,
    dex_hisui: "193",
  },
  {
    id: "rotom",
    name: "Rotom",
    dex_national: 479,
    dex_hisui: "194",
  },
  {
    id: "chingling",
    name: "Chingling",
    dex_national: 433,
    dex_hisui: "195",
  },
  {
    id: "chimecho",
    name: "Chimecho",
    dex_national: 358,
    dex_hisui: "196",
  },
  {
    id: "misdreavus",
    name: "Misdreavus",
    dex_national: 200,
    dex_hisui: "197",
  },
  {
    id: "mismagius",
    name: "Mismagius",
    dex_national: 429,
    dex_hisui: "198",
  },
  {
    id: "cleffa",
    name: "Cleffa",
    dex_national: 173,
    dex_hisui: "199",
  },
  {
    id: "clefairy",
    name: "Clefairy",
    dex_national: 35,
    dex_hisui: "200",
  },
  {
    id: "clefable",
    name: "Clefable",
    dex_national: 36,
    dex_hisui: "201",
  },
  {
    id: "sneasel",
    name: "Sneasel",
    dex_national: 215,
    dex_hisui: "202",
  },
  {
    id: "sneasler",
    name: "Sneasler",
    dex_national: 903,
    dex_hisui: "203",
  },
  {
    id: "weavile",
    name: "Weavile",
    dex_national: 461,
    dex_hisui: "204",
  },
  {
    id: "snorunt",
    name: "Snorunt",
    dex_national: 361,
    dex_hisui: "205",
  },
  {
    id: "glalie",
    name: "Glalie",
    dex_national: 362,
    dex_hisui: "206",
  },
  {
    id: "froslass",
    name: "Froslass",
    dex_national: 478,
    dex_hisui: "207",
  },
  {
    id: "cranidos",
    name: "Cranidos",
    dex_national: 408,
    dex_hisui: "208",
  },
  {
    id: "rampardos",
    name: "Rampardos",
    dex_national: 409,
    dex_hisui: "209",
  },
  {
    id: "shieldon",
    name: "Shieldon",
    dex_national: 410,
    dex_hisui: "210",
  },
  {
    id: "bastiodon",
    name: "Bastiodon",
    dex_national: 411,
    dex_hisui: "211",
  },
  {
    id: "swinub",
    name: "Swinub",
    dex_national: 220,
    dex_hisui: "212",
  },
  {
    id: "piloswine",
    name: "Piloswine",
    dex_national: 221,
    dex_hisui: "213",
  },
  {
    id: "mamoswine",
    name: "Mamoswine",
    dex_national: 473,
    dex_hisui: "214",
  },
  {
    id: "bergmite",
    name: "Bergmite",
    dex_national: 712,
    dex_hisui: "215",
  },
  {
    id: "avalugg",
    name: "Avalugg",
    dex_national: 713,
    dex_hisui: "216",
  },
  {
    id: "snover",
    name: "Snover",
    dex_national: 459,
    dex_hisui: "217",
  },
  {
    id: "abomasnow",
    name: "Abomasnow",
    dex_national: 460,
    dex_hisui: "218",
  },
  {
    id: "zorua",
    name: "Zorua",
    dex_national: 570,
    dex_hisui: "219",
  },
  {
    id: "zoroark",
    name: "Zoroark",
    dex_national: 571,
    dex_hisui: "220",
  },
  {
    id: "rufflet",
    name: "Rufflet",
    dex_national: 627,
    dex_hisui: "221",
  },
  {
    id: "braviary",
    name: "Braviary",
    dex_national: 628,
    dex_hisui: "222",
  },
  {
    id: "riolu",
    name: "Riolu",
    dex_national: 447,
    dex_hisui: "223",
  },
  {
    id: "lucario",
    name: "Lucario",
    dex_national: 448,
    dex_hisui: "224",
  },
  {
    id: "uxie",
    name: "Uxie",
    dex_national: 480,
    dex_hisui: "225",
  },
  {
    id: "mesprit",
    name: "Mesprit",
    dex_national: 481,
    dex_hisui: "226",
  },
  {
    id: "azelf",
    name: "Azelf",
    dex_national: 482,
    dex_hisui: "227",
  },
  {
    id: "heatran",
    name: "Heatran",
    dex_national: 485,
    dex_hisui: "228",
  },
  {
    id: "regigigas",
    name: "Regigigas",
    dex_national: 486,
    dex_hisui: "229",
  },
  {
    id: "cresselia",
    name: "Cresselia",
    dex_national: 488,
    dex_hisui: "230",
  },
  {
    id: "tornadus",
    name: "Tornadus",
    dex_national: 641,
    dex_hisui: "231",
  },
  {
    id: "thundurus",
    name: "Thundurus",
    dex_national: 642,
    dex_hisui: "232",
  },
  {
    id: "landorus",
    name: "Landorus",
    dex_national: 645,
    dex_hisui: "233",
  },
  {
    id: "enamorus",
    name: "Enamorus",
    dex_national: 905,
    dex_hisui: "234",
  },
  {
    id: "dialga",
    name: "Dialga",
    dex_national: 483,
    dex_hisui: "235",
  },
  {
    id: "palkia",
    name: "Palkia",
    dex_national: 484,
    dex_hisui: "236",
  },
  {
    id: "giratina",
    name: "Giratina",
    dex_national: 487,
    dex_hisui: "237",
  },
  {
    id: "arceus",
    name: "Arceus",
    dex_national: 493,
    dex_hisui: "238",
  },
  {
    id: "phione",
    name: "Phione",
    dex_national: 489,
    dex_hisui: "239",
  },
  {
    id: "manaphy",
    name: "Manaphy",
    dex_national: 490,
    dex_hisui: "240",
  },
  {
    id: "shaymin",
    name: "Shaymin",
    dex_national: 492,
    dex_hisui: "241",
  },
  {
    id: "darkrai",
    name: "Darkrai",
    dex_national: 491,
    dex_hisui: "242",
  },
];

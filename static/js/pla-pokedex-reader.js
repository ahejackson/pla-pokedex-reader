const researchTable = document.querySelector(".pla-research-table");
const rowTemplate = document.querySelector("[data-pla-research-row-template]");
const shinyCharmCheckbox = document.getElementById("pla-research-shinycharm");
const filterInput = document.getElementById("filterlist");

let hisuidex = [];
const researchRows = new Map();
const researchRadios = new Map();

function loadPokedex() {
  fetch("/api/hisuidex")
    .then((response) => response.json())
    .then((res) => {
      hisuidex = res.hisuidex;

      // The javascript is wired up to the page once the pokedex data has loaded
      initialisePage();
    })
    .catch((error) => {});
}

// This gets done first, to make sure the pokedex is loaded before the page is properly configured
loadPokedex();

const initialisePage = () => {
  hisuidex.forEach((pokemon) => {
    const row = rowTemplate.content.cloneNode(true);
    row.querySelector(".pla-research-row-name").innerText = pokemon.name;
    row.querySelector(
      "[data-pla-research-row-img]"
    ).src = `/static/img/sprite/c_${pokemon.dex_national}.png`;
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
  });

  document.getElementById("pla-research-all0").addEventListener("click", () => {
    for (const [_, radios] of researchRadios) {
      radios[0].checked = true;
      radios[1].checked = false;
      radios[2].checked = false;
    }
    saveResearch();
  });

  document.getElementById("pla-research-all1").addEventListener("click", () => {
    for (const [_, radios] of researchRadios) {
      radios[0].checked = false;
      radios[1].checked = true;
      radios[2].checked = false;
    }
    saveResearch();
  });

  document.getElementById("pla-research-all3").addEventListener("click", () => {
    for (const [_, radios] of researchRadios) {
      radios[0].checked = false;
      radios[1].checked = false;
      radios[2].checked = true;
    }
    saveResearch();
  });

  filterInput.addEventListener("keyup", (e) => {
    const filterText = e.target.value.toLowerCase();
    for (const [name, row] of researchRows) {
      name.toLowerCase().startsWith(filterText)
        ? (row.style.display = "table-row")
        : (row.style.display = "none");
    }
  });

  shinyCharmCheckbox.addEventListener("change", saveResearch);

  document.getElementById("pla-research-load").addEventListener("click", () => {
    loadResearch();
  });

  document.getElementById("pla-research-save").addEventListener("click", () => {
    saveResearch();
  });

  loadResearch();
};

function loadResearch() {
  let plaResearchString = localStorage.getItem("plaResearch");

  if (plaResearchString == null) {
    saveResearch();
  } else {
    let plaResearch = JSON.parse(plaResearchString);
    shinyCharmCheckbox.checked = plaResearch["shinycharm"];

    Object.entries(plaResearch["pokedex"]).forEach(([name, value]) => {
      setRadioValue(researchRadios.get(name), value);
    });
  }
}

function getResearch() {
  const research = {};
  research["shinycharm"] = shinyCharmCheckbox.checked;
  research["pokedex"] = {};

  hisuidex.forEach((pokemon) => {
    research["pokedex"][pokemon.name] = getRadioValue(
      researchRadios.get(pokemon.name)
    );
  });
  return research;
}

function saveResearch() {
  localStorage.setItem("plaResearch", JSON.stringify(getResearch()));
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

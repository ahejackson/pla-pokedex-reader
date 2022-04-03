const researchTable = document.querySelector(".pla-research-table");
const rowTemplate = document.querySelector("[data-pla-research-row-template]");
const shinyCharmCheckbox = document.querySelector("#pla-research-shinycharm");
const filterInput = document.querySelector("#filterlist");

let hisuidex = [];
const researchRows = new Map();
const researchRadios = new Map();

const modal = document.querySelector("#pla-research-load-modal");
const fileUpload = document.querySelector("#pla-research-fileupload");

const errors = document.querySelector("[data-pla-errors]");
const modalErrors = document.querySelector("[data-pla-modal-errors]");

const VALID_FILESIZES = [0x136dde, 0x13ad06];

function loadPokedex() {
  fetch("/api/hisuidex")
    .then((response) => response.json())
    .then((res) => {
      hisuidex = res.hisuidex;

      // The javascript is wired up to the page once the pokedex data has loaded
      initialisePage();
    })
    .catch((error) => {
      showError(
        "There was an error connecting to the server, the program is not running properly"
      );
    });
}

// This gets done first, to make sure the pokedex is loaded before the page is properly configured
loadPokedex();

const initialisePage = () => {
  hisuidex.forEach((pokemon) => {
    const row = rowTemplate.content.cloneNode(true);
    row.querySelector(".pla-research-row-name").textContent = pokemon.name;
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

  document.querySelector("#pla-research-all0").addEventListener("click", () => {
    for (const [_, radios] of researchRadios) {
      radios[0].checked = true;
      radios[1].checked = false;
      radios[2].checked = false;
    }
    saveResearch();
  });

  document.querySelector("#pla-research-all1").addEventListener("click", () => {
    for (const [_, radios] of researchRadios) {
      radios[0].checked = false;
      radios[1].checked = true;
      radios[2].checked = false;
    }
    saveResearch();
  });

  document.querySelector("#pla-research-all3").addEventListener("click", () => {
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

  document
    .querySelector("[data-pla-research-load-open]")
    .addEventListener("click", () => {
      modal.showModal();
    });

  document
    .querySelector("[data-pla-research-load-close]")
    .addEventListener("click", () => {
      fileUpload.value = null;
      modal.close();
    });

  fileUpload.addEventListener("change", (e) => {
    selectSaveFile(e.target.files);
  });

  loadResearch();
  modal.showModal();
};

function selectSaveFile(files) {
  if (files.length != 1) {
    showModalError("Select a file");
    return;
  }

  const [file] = files;

  if (file.name != "main") {
    showModalError('Select the file "main"');
    return;
  }

  if (VALID_FILESIZES.indexOf(file.size) < 0) {
    showModalError(
      "The file you chose isn't the right size for the PLA save file"
    );
    return;
  }

  const formData = new FormData();
  formData.append("save", file);

  fetch("/api/upload", {
    method: "POST",
    body: formData,
  })
    .then((response) => response.json())
    .then((res) => {
      console.log(res);

      if (res.hasOwnProperty("error")) {
        showModalError(error);
      } else {
        fileUpload.value = null;
        modal.closeModal();
      }
    })
    .catch((error) => {
      showModalError(error);
    });
}

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

function showError(error) {
  errorDiv = document.createElement("div");
  errorDiv.classList.add("pla-error");
  errorDiv.textContent = error;
  errors.appendChild(errorDiv);
}

function showModalError(error) {
  modalErrors.innerHTML = "";
  errorDiv = document.createElement("div");
  errorDiv.classList.add("pla-error");
  errorDiv.textContent = error;
  modalErrors.appendChild(errorDiv);
}

# PLA Pokedex Reader

A Flask application that reads pokedex completion information from Pokemon Legends: Arceus save files.

This is a proof of concept for how to integrate this functionality into other RNG tools.

# How to run

1. Clone the repository from github
2. Open a command line prompt and go to the repository directory
3. Install the requirements: `pip install -r requirements.txt`
4. Run the app: `flask run`
5. Open `http://localhost:8100/` in your browser
6. Select a save file to read Pokedex research progress from it. View the contents of localStorage in your browser to see what data is saved.

## Requirements

- [Python](https://www.python.org/downloads/)

## Credits

- The incredible [PKHeX](https://github.com/kwsch/PKHeX) by [Kurt](https://github.com/kwsch) and other contributors for documenting the save files

# PLA Research Reader

A Flask application for setting Pokédex research level information, including by reading it from Pokemon Legends: Arceus save files.

This is a proof of concept for how to integrate this functionality into other RNG tools.

[View a demo of the UI (without save loading)](https://ahejackson.github.io/pla-research-reader)

# How to run

1. Clone the repository
2. Open a command line prompt and go to the repository directory
3. Install the requirements: `pip install -r requirements.txt`
4. Run the app: `flask run`
5. Open `http://localhost:8100/` in your browser
6. Select a save file to read Pokedex research progress from it. View the contents of localStorage in your browser to see what data is saved.

## Requirements

- [Python](https://www.python.org/downloads/)
- CFW if you're going to read save files

## Credits

- The incredible [PKHeX](https://github.com/kwsch/PKHeX) by [Kurt](https://github.com/kwsch) and other contributors for the huge amount of work they do documenting the save file structure, encryption methods and many other things.

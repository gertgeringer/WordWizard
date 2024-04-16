# 🧙 WordWizard

**WordWizard** is a cross-platform desktop app that I built for my wife. She is a teacher and needs a way to evaluate
the word reading speed of her students. The app is a simple game where the student reads a list of words and the app
records the time it takes to read them.

## Tech stack

The app is built with [Tauri](https://tauri.studio/) and [React](https://react.dev/). All data are stored locally in a
JSON file (might change that to SQLITE at a later stage 😊). For the UI I used [Mantine](https://mantine.dev/), which is
awesome.

## Building locally

Follow the [quickstart guide](https://tauri.app/v1/guides/getting-started/setup/vite) from Tauri to run this locally.

Then run the app with:

    yarn dev tauri

## TODO:

Split up database into separate json files
Auto updates
Check the timer for the words read to make sure its accurate


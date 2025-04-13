# Visualize Transforms

This is a project to visualize the transforms of discrete signals and operations between two or multiple discrete signals (mainly DFT and convolution)

![Screenshot of the website](image.png)
## Installation (locally)

1. Install fftw3 in /usr/include
2. Inside ./src/api/ folder run `gcc signal_computer.c -lm -lfftw3 -o signal_computer_exec`
3. Activate a nodejs environment inside the project
4. Run `pnpm install`
5. Run `pnpm run dev`

In accordance with the licence of the charts library lightweight-charts read this notice:
TradingView Lightweight Charts™
Copyright (с) 2025 TradingView, Inc. https://www.tradingview.com/

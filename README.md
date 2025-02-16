# Visualize Transforms

This is a project to visualize the transforms of discrete signals and operations between two or multiple discrete signals (mainly DFT and convolution)

## Installation

1. Install fftw3 in /usr/include
2. Inside /src/signals/ folder run `gcc signal_computer.c -lm -lfftw3 -o signal_computer_exec`
2. Activate a nodejs environment
3. Run `pnpm install`
4. Run `pnpm run dev`

## Code Improvements

- Use structs to encapsulate parameters
- Make global argv, argc as such:

  ```c
  char **gargv;
  int gargc;
  ```

Snippet from [here](https://www.unix.com/programming/173428-how-access-argv-x-another-function-other-than-main.html)

Another way of doing a similar thing [here](https://stackoverflow.com/questions/43729256/argc-and-argv-for-functions-other-than-main)

## IDEAS
- [ ] Let the user adjust the necessary parameters and you can save those function parameters and combine them (sum, product, convolution) with other saved functions
    - Input is done with buttons:
        - A signal button, you can choose between the square, triangle, sine, etc. icons
        - Amplitude, frequency, range wheels
- [ ] Use IPC message passing or memory sharing instead of using node to invoke execution
- [ ] Add auto set button
- [ ] Fix rounding errors (for freq)
- [x] Show only a narrow window of frequencies (different for cos, sin, exp, etc.)
- [ ] Add debug mode (with #ifndef)
- [ ] Allow only parametrized input (you can only input the parameters to the function that I permit, with limited degrees of freedom)
- [ ] Chain functions to simulate operations (add, subtract, multiply, divide, convolve, correlate, circular convolution???, etc.)
- [ ] Real, Imaginary & Complex graph
- [ ] Load your signal with a formatted text/JSON/whatever file
- [ ] Add the sum of cos & sin
- [ ] Add complex exponential (cos+isin)
- [ ] Lead to the discovery of the ft by convolution (like in Mark Newman's video)
- [ ] Build an FFT and convolution algorithm
- [ ] Other transforms (Cosine, sine, sinc transforms...)
- [ ] Load graphs by chunks (first 100 samples, etc.) or lazy load (load average of every 10, 5, 2 samples etc.)
- [ ] Try using another plotting library (canvas, [function plot](https://mauriciopoppe.github.io/function-plot/), etc.)

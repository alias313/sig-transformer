# Visualize Transforms

This is a project to visualize the transforms of discrete signals and operations between two or multiple discrete signals (mainly DFT and convolution)

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

- Allow only parametrized input (you can only input the parameters to the function that I permit, limited degrees of freedom)
- Chain functions to simulate operations (add, subtract, multiply, divide, convolve, correlate, circular convolution???, etc.)
- Real, Imaginary & Complex graph
  Load your signal with a formatted text/json/whatever file
- Add sum of cos & sin
- Add complex exponential (cos+isin)
- Lead to the discovery of the ft by convolution (like in Mark Newman's video)
- Build an fft and convolution algorithm
- Other transforms (Cosine, sine, sinc transforms...)
- Load graphs by chunks (first 100 samples, etc.) or lazy load (load average of every 10, 5, 2 samples etc.)

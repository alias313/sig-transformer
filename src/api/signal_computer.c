#include <stdlib.h>
#include <math.h>
#include <fftw3.h>
#include <string.h>

#define M_PI 3.14159265358979323846

#define N 1000

#define a_argpos 1
#define b_argpos 2
#define sig_argpos 3
#define amp_argpos 4
#define freq_argpos 5
#define pulse_argpos 5
#define phase_argpos 6
#define interval_argpos 7

int cosine(fftw_complex in[], double input_array[],
          int total_samples, double sampling_interval,
          double a, double b, double amp, double freq_hz, double phase_rad);

int sine(fftw_complex in[], double input_array[],
          int total_samples, double sampling_interval,
          double a, double b, double amp, double freq_hz, double phase_rad);

int sinc(fftw_complex in[], double input_array[],
                        int total_samples, double sampling_interval,
                        double a, double b, double amp, double freq_hz, double phase_rad);

int square_centered(fftw_complex in[], double input_array[],
                      int total_samples, double sampling_interval,
                      double a, double b, double amp, double pulse_length);

int exponential(fftw_complex in[], double input_array[],
                      int total_samples, double sampling_interval,
                      double a, double b, double amp);

int triangle_centered(fftw_complex in[], double input_array[],
  int total_samples, double sampling_interval,
  double a, double b, double amp, double pulse_length);
  

int main(int argc, char *argv[])
{

  FILE *fptr;

  const double a = atof(argv[a_argpos]);
  const double b = atof(argv[b_argpos]);
  const double amp = atof(argv[amp_argpos]);
  const double freq_hz = atof(argv[freq_argpos]);
  const double pulse_length = atof(argv[pulse_argpos]);
  const double phase_rad = atof(argv[phase_argpos]);
  const double interval = atof(argv[interval_argpos]);

  const double sampling_interval = interval;
  const double zero_cutoff = sampling_interval / 2;
  const int total_samples = ceil((b - a) / sampling_interval) + 1;
  int rightmost_index = 0;
  printf("Total samples: %d\n", total_samples);

  fftw_complex in[total_samples], out[total_samples], in2[total_samples]; /* double [2] */
  fftw_plan p, q;
  int i;
  double input_array[total_samples];

  /* prepare signal */
  if (!strcmp(argv[sig_argpos], "cos"))
  {
    rightmost_index = cosine(in, input_array, total_samples, sampling_interval,
                              a, b, amp, freq_hz, phase_rad);
  }
  else if (!strcmp(argv[sig_argpos], "sin"))
  {
      rightmost_index = sine(in, input_array, total_samples, sampling_interval,
                              a, b, amp, freq_hz, phase_rad);
  }
  else if (!strcmp(argv[sig_argpos], "sinc"))
  {
      rightmost_index = sinc(in, input_array, total_samples, sampling_interval,
                                           a, b, amp, freq_hz, phase_rad);
  }
  else if (!strcmp(argv[sig_argpos], "square"))
  {
    rightmost_index = square_centered(in, input_array, total_samples, sampling_interval,
                                      a, b, amp, pulse_length);

  }
  else if (!strcmp(argv[sig_argpos], "exp"))
  {
    rightmost_index = exponential(in, input_array, total_samples, sampling_interval,
                                      a, b, amp);
  }
  else if (!strcmp(argv[sig_argpos], "triangle"))
  {
    rightmost_index = triangle_centered(in, input_array, total_samples, sampling_interval,
                                      a, b, amp, pulse_length);

  }
  else
  {
    printf("%s isn't recognized as an implemented signal to compute\n", argv[sig_argpos]);
    return 1;
  }

  double modulus[total_samples];
  /* forward Fourier transform, save the result in 'out' */
  p = fftw_plan_dft_1d(total_samples, in, out, FFTW_FORWARD, FFTW_ESTIMATE);
  fftw_execute(p);

  fptr = fopen("fft_out.json", "w");

  fprintf(fptr, "[\n");
  for (i = 0; i < total_samples; i++)
  {
    double freq = (i-rightmost_index) / ((total_samples-1) * sampling_interval);
    if (i < rightmost_index)
    {
      int i_left_shifted = i + rightmost_index + 1;
      modulus[i_left_shifted] = sqrt(out[i_left_shifted][0] * out[i_left_shifted][0] + out[i_left_shifted][1] * out[i_left_shifted][1]);
      
      fprintf(fptr, "{\"Freq\": %.2f, \"re(FFT)\": %.5f, \"im(FFT)\": %.5f, \"abs(FFT)\": %.5f, \"input\": %.5f, \"re(signal)\": %.5f}%s\n", 
                    freq, out[i_left_shifted][0]*sampling_interval, out[i_left_shifted][1]*sampling_interval, modulus[i_left_shifted]*sampling_interval, input_array[i_left_shifted], in[i_left_shifted][0], (i == total_samples - 1) ? "" : ",");
    }
    else
    {
      int i_right_shifted = i - rightmost_index;
      modulus[i_right_shifted] = sqrt(out[i_right_shifted][0] * out[i_right_shifted][0] + out[i_right_shifted][1] * out[i_right_shifted][1]);
      fprintf(fptr, "{\"Freq\": %.2f, \"re(FFT)\": %.5f, \"im(FFT)\": %.5f, \"abs(FFT)\": %.5f, \"input\": %.5f, \"re(signal)\": %.5f}%s\n", 
                    freq, out[i_right_shifted][0]*sampling_interval, out[i_right_shifted][1]*sampling_interval, modulus[i_right_shifted]*sampling_interval, input_array[i_right_shifted], in[i_right_shifted][0], (i == total_samples - 1) ? "" : ",");
    }
  }
  fprintf(fptr, "]\n");

  fclose(fptr);

  fftw_destroy_plan(p);

  /* backward Fourier transform, save the result in 'in2' */

  /*   printf("\nInverse transform:\n");
    q = fftw_plan_dft_1d(total_samples, out, in2, FFTW_BACKWARD, FFTW_ESTIMATE);
    fftw_execute(q);
    // normalize
    for (i = 0; i < total_samples; i++) {
      in2[i][0] *= 1./total_samples;
      in2[i][1] *= 1./total_samples;
    }

     printf("(00000) Freq\tInput Signal\t\t   Inverse FFT\n");
    for (i = 0; i < total_samples; i++) {
      double input = a+i*sampling_interval;
      printf("(%05d) %+4.3f %+9.5f %+9.5f I vs. %+9.5f %+9.5f I  difference: %+24.22f\n",
          i, input, in[i][0], in[i][1], in2[i][0], in2[i][1], in[i][0]-in2[i][0]);
    }
    fftw_destroy_plan(q); */

  fftw_cleanup();

  return 0;
}

int cosine(fftw_complex in[], double input_array[],
          int total_samples, double sampling_interval,
          double a, double b, double amp, double freq_hz, double phase_rad)
{
  int i, rightmost_index;
  double input;
  for (i = 0; i < total_samples; i++)
  {
    if (i < ceil(total_samples / 2) + 1)
    {
      input = a + i * sampling_interval + ceil(total_samples / 2) * sampling_interval;

      rightmost_index = i;
    }
    else
    {
      input = a + i * sampling_interval - ceil(total_samples / 2) * sampling_interval - sampling_interval;
    }
    input_array[i] = input;

    in[i][0] = amp * cos(freq_hz * 2 * M_PI * input - phase_rad);
    in[i][1] = 0;
    // printf("%d input %8.5f\n", i, input);
  }

  return rightmost_index;
}

int sine(fftw_complex in[], double input_array[],
          int total_samples, double sampling_interval,
          double a, double b, double amp, double freq_hz, double phase_rad)
{
  int i, rightmost_index;
  double input;
  for (i = 0; i < total_samples; i++)
  {
    if (i < ceil(total_samples / 2) + 1)
    {
      input = a + i * sampling_interval + ceil(total_samples / 2) * sampling_interval;

      rightmost_index = i;
    }
    else
    {
      input = a + i * sampling_interval - ceil(total_samples / 2) * sampling_interval - sampling_interval;
    }
    input_array[i] = input;

    in[i][0] = amp * sin(freq_hz * 2 * M_PI * input - phase_rad);
    in[i][1] = 0;
    // printf("%d input %8.5f\n", i, input);
  }

  return rightmost_index;
}

int sinc(fftw_complex in[], double input_array[],
                       int total_samples, double sampling_interval,
                       double a, double b, double amp, double freq_hz, double phase_rad)
{
  int i, rightmost_index;
  double input;
  for (i = 0; i < total_samples; i++)
  {
    if (i < ceil(total_samples / 2) + 1)
    {
      input = a + i * sampling_interval + ceil(total_samples / 2) * sampling_interval;

      rightmost_index = i;
    }
    else
    {
      input = a + i * sampling_interval - ceil(total_samples / 2) * sampling_interval - sampling_interval;
    }
    input_array[i] = input;

    if (input != 0)
      in[i][0] = amp * sin(freq_hz * M_PI * input - phase_rad) / (freq_hz * M_PI * input - phase_rad);
    else {
      if (phase_rad == 0)
        in[i][0] = amp;
      else
        in[i][0] = amp * sin(freq_hz * M_PI * input - phase_rad) / (freq_hz * M_PI * input - phase_rad);
    }
    in[i][1] = 0;
    // printf("%d input %8.5f\n", i, input);
  }

  return rightmost_index;
}

int square_centered(fftw_complex in[], double input_array[],
                      int total_samples, double sampling_interval,
                      double a, double b, double amp, double pulse_length)
{
  int i, rightmost_index;
  double input;
  for (i = 0; i < total_samples; i++)
    {
      if (i < ceil(total_samples / 2) + 1)
      {
        input = a + i * sampling_interval + ceil(total_samples / 2) * sampling_interval;

        if (i * sampling_interval < pulse_length/2 + sampling_interval)
        {
          in[i][0] = amp;
          in[i][1] = 0;
        }
        else
        {
          in[i][0] = 0;
          in[i][1] = 0;
        }
        rightmost_index = i;
      }
      else
      {
        input = a + i * sampling_interval - ceil(total_samples / 2) * sampling_interval - sampling_interval;

        int i_left_shifted = i - rightmost_index;
        if (i_left_shifted * sampling_interval > floor(total_samples / 2) * sampling_interval - pulse_length / 2 + sampling_interval / 2)
        {
          in[i][0] = amp;
          in[i][1] = 0;
        }
        else
        {
          in[i][0] = 0;
          in[i][1] = 0;
        }
      }
      input_array[i] = input;
    }

  return rightmost_index;
}

int exponential(fftw_complex in[], double input_array[],
                      int total_samples, double sampling_interval,
                      double a, double b, double amp) 
{
  int i, rightmost_index;
  double input;
  for (i = 0; i < total_samples; i++)
  {
    if (i < ceil(total_samples / 2) + 1)
    {
      input = a + i * sampling_interval + ceil(total_samples / 2) * sampling_interval;

      rightmost_index = i;
    }
    else
    {
      input = a + i * sampling_interval - ceil(total_samples / 2) * sampling_interval - sampling_interval;
    }
    input_array[i] = input;

    in[i][0] = amp * exp(input);
    in[i][1] = 0;
    // printf("%d input %8.5f\n", i, input);
  }

  return rightmost_index;
}

int triangle_centered(fftw_complex in[], double input_array[],
  int total_samples, double sampling_interval,
  double a, double b, double amp, double pulse_length)
{
  int i, rightmost_index;
  double input;
  for (i = 0; i < total_samples; i++)
    {
      if (i < ceil(total_samples / 2) + 1)
      {
        input = a + i * sampling_interval + ceil(total_samples / 2) * sampling_interval;

        if (i * sampling_interval < pulse_length + sampling_interval)
        {
          in[i][0] = amp*(pulse_length-input)/(pulse_length);
          in[i][1] = 0;
        }
        else
        {
          in[i][0] = 0;
          in[i][1] = 0;
        }
        rightmost_index = i;
      }
      else
      {
        input = a + i * sampling_interval - ceil(total_samples / 2) * sampling_interval - sampling_interval;

        int i_left_shifted = i - rightmost_index;
        if (i_left_shifted * sampling_interval > floor(total_samples / 2) * sampling_interval - pulse_length + sampling_interval / 2)
        {
          in[i][0] = amp*(input+pulse_length)/(pulse_length);
          in[i][1] = 0;
        }
        else
        {
          in[i][0] = 0;
          in[i][1] = 0;
        }
      }
      input_array[i] = input;
    }

  return rightmost_index;

}

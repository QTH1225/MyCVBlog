---
title: Images and Math Test
date: 2026-10-14
summary: Test local images, inline math, display equations, matrices, tables, and code blocks.
tags: Markdown, Math, Images
---

This note tests images and mathematical notation alongside regular text. It uses the same anonymous header as the rest of the website.

## 1. Local Images

The following image loads from the website's `assets/images` folder and scales to fit the available width.

![Illustration of the function y=x²](assets/images/note-demo.svg "SVG image")

*Figure 1. An SVG illustration with x on the horizontal axis and y on the vertical axis.*

Here is the same illustration in PNG format:

![Sample PNG illustration](assets/images/note-demo.png "PNG image")

*Figure 2. A PNG illustration. Both formats use standard Markdown image syntax.*

Image paths start at the website root:

```markdown
![Image description](assets/images/your-image.png "Optional image title")
```

## 2. Inline Math

The linear elastic relation is $\sigma = E\varepsilon$, where $E$ is Young's modulus. Subscripts, powers, and Greek letters also work: $x_i^2$ and $\alpha + \beta$.

```markdown
The linear elastic relation is $\sigma = E\varepsilon$.
```

## 3. Display Equations

Place an equation between two lines containing `$$` to display it on a separate, centered line:

$$
\int_0^1 x^2\,\mathrm{d}x = \left[\frac{x^3}{3}\right]_0^1 = \frac{1}{3}
$$

```markdown
$$
\int_0^1 x^2\,\mathrm{d}x = \frac{1}{3}
$$
```

## 4. Multiline Equations and Matrices

Use the `aligned` environment to align the steps of a calculation:

$$
\begin{aligned}
f(x) &= x^2 + 2x + 1 \\
     &= (x + 1)^2 \\
f'(x) &= 2x + 2
\end{aligned}
$$

Matrices and vectors can appear in the same equation:

$$
\begin{bmatrix}
2 & -1 \\
-1 & 2
\end{bmatrix}
\begin{bmatrix}
u_1 \\ u_2
\end{bmatrix}
=
\begin{bmatrix}
F_1 \\ F_2
\end{bmatrix}
$$

## 5. Tables, Lists, and Code

Inline math also works inside tables:

| Feature | Example | Purpose |
| --- | --- | --- |
| Subscript | $x_i$ | Identify the i-th element |
| Summation | $\sum_{i=1}^{n} x_i$ | Sum a series of values |
| Fraction | $\frac{a}{b}$ | Express a ratio |

- Use **bold** and *italics* to highlight key terms.
- Use blockquotes for excerpts or reminders.
- Code blocks preserve indentation and line breaks. Dollar signs inside them are not rendered as math.

> This is a blockquote. Use it for reading excerpts, observations, or questions to revisit.

```python
def square(x):
    return x ** 2

print(square(3))
```

## 6. Literal Text and Long Equations

To show math as literal text, put it inside backticks, as in `$E = mc^2$`. Escape a regular dollar sign with `\$`: for example, the price is \$20.

On narrow screens, long equations scroll horizontally within their own area while the rest of the page keeps its normal width:

$$
\mathcal{L}(\theta) = \frac{1}{N}\sum_{i=1}^{N}\left(y_i - \sum_{j=1}^{M}\theta_j x_{ij}\right)^2 + \lambda\sum_{j=1}^{M}\theta_j^2
$$

This note checks image loading, equation layout, and page overflow on mobile screens.

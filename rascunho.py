def valores():
    n = float(input('Digite os valores: '))
    return n


def resultado(a, b, c):
    print(f'TRIANGULO: {(a * c) / 2:.3f}')
    print(f'CIRCULO: {(c ** 2) * 3.14159:.3f}')
    print(f'TRAPEZIO: {((a + b) * c) / 2:.3f}')
    print(f'QUADRADO: {b ** 2:.3f}')
    print(f'TRIANGULO: {(a * b):.3f}')



a = valores()
b = valores()
c = valores()
resultado(a, b, c)

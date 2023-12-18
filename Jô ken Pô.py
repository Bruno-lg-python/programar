
# Funções do Programa
def opcoes(eu):
    match eu:
        case 0:
            return 'PEDRA'
        case 1:
            return 'PAPEL'
        case 2:
            return 'TESOURA'
        
def opcoespc(pc):
    match pc:
        case 0:
            return 'PEDRA'
        case 1:
            return 'PAPEL'
        case 2:
            return 'TESOURA'
        
def leiaInt(msg):
    ok = False
    valor = ''
    while True:
        n = str(input(msg))
        if n.isnumeric():
            valor = int(n)
            if 0< valor >2:
                print('''\033[0;31mERRO! Digite um numero entre
[0] PEDRA
[1] PAPEL
[2] TESOURA!\033[m''')
            else:
                ok = True
                break
        else:
            print('\033[0;31mERRO! Digite um numero Válido!\033[m')         
        if ok:
            break
    return valor

def resposta(rp):
    while True:
        n = str(input(rp)).upper()
        if n == 'S':
            return n
        if n == 'N':
            return n
        else:
            print('\033[0;31mERRO! Digite a resposta entre [S/N] !\033[m')


# Programa principal
from random import randint
from time import sleep
import os
win = 0
winpc = 0
empate = 0

while True:
    print(f'{"Placar Do Jogo"}')
    print(f'Voçê está com {win} Pontos')
    print(f'O Computador está com {winpc} pontos\n')
    print('''DIGITE A OPÇÃO DESEJADA ENTRE
          
          [0]PEDRA
          [1]PAPEL
          [2]TESOURA
''')
    # Opção do pc
    pc = randint(0, 2)
    # Opção do Usuario
    voçe = leiaInt('Qual a sua Escolha: ')
    opcoespc(pc)
    opcoes(voçe)

    print('''
        JÔ''')
    sleep(0.5)
    print('''
        KEN''')
    sleep(0.5)
    print('''
        PÓ''')
    sleep(0.5)

    # Resultado das apostas
    if voçe > pc:
        print(f'Voçê escolheu {opcoes(voçe)} e o computador escolheu {opcoespc(pc)}.\nVoçê ganhou')
        win += 1
    if voçe < pc:
        print(f'Voçê escolheu {opcoes(voçe)} e o computador escolheu {opcoespc(pc)}. \nO computador ganhou')
        winpc += 1
    if voçe == pc:
        print(f'Voçê escolheu {opcoes(voçe)} e o computador escolheu {opcoespc(pc)}. \nEmpatou')
        empate += 1

    # Entrada da Resposta
    resp = resposta('Deseja continuar: ')
    if resp in 'Nn':
        print('Voçe decidiu parar, Obrigado por Jogar')
        break
    os.system('cls')
# Resultado final
    if win >= 5:
        print(f'Voçê Ganhou, fez os {win} pontos primeiro \n <<<<<<<FIM DO JOGO>>>>>>>')
        break    
    if winpc >= 5:
        print(f'O computador Ganhou, fez os {winpc} pontos primeiro \n <<<<<<<FIM DO JOGO>>>>>>>')
        break

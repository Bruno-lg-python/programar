from random import randint
from time import sleep
import os
win = 0
winpc = 0
empate = 0
resp = ' '
while win != 5 and winpc != 5 and resp != 'N':
    print('Brincando Jô Ken Pô...')
    print('''Quem Fizer 5 pontos 1° e o vencedor
        Placar
    \033[32mCOMPUTADOR\033[m {}
    \033[33mUSUARIO\033[m {}
    \033[36mEMPATE\033[m {}\n'''.format(winpc, win, empate))
    print('Aposte em PEDRA, PAPEL OU TESOURA\n')
    print('''Escolha sua aposta
        [0] PEDRA 
        [1] PAPEL 
        [2] TESOURA''')
    computador = randint(0, 2)
    itens = ('PEDRA', 'PAPEL', 'TESOURA')
    resp = ' '
    eu = int(input('Qual a sua escolha: '))
    print()
    while eu > 2:
        print('\033[31mOpção Invalida!!!!\033[m')
        eu = int(input('Escolha Novamente: '))
        print()
    print('''
    \033[32m***###!!! JÔ !!!###***\033[m''')
    sleep(0.5)
    print('''
    \033[33m***###!!! KEN !!!###***\033[m''')
    sleep(0.5)
    print('''
    \033[35m***###!!! PÔ !!!###***\033[m\n''')
    print('USUARIO escolheu {}'.format(itens[eu]))
    print('O COMPUTADOR escolheu {}\n'.format(itens[computador]))
    if eu == 0:
        if computador == 0:
            empate += 1
            print('\033[36mEMPATOU!!!\033[m\n')
        elif computador == 1:
            winpc += 1
            print('\033[32mO COMPUTADOR GANHOU!!!\033[m\n')
        elif computador == 2:
            win += 1
            print('\033[33mO USUÁRIO GANHOU!!!\033[m\n')
    elif eu == 1:
        if computador == 0:
            win += 1
            print('\033[33mO USUÁRIO GANHOU!!!\033[m\n')
        elif computador == 1:
            empate += 1
            print('\033[36mEMPATOU!!!\033[m\n')
        elif computador == 2:
            winpc += 1
            print('\033[32mO COMPUTADOR GANHOU!!!\033[m\n')
    elif eu == 2:
        if computador == 0:
            winpc += 1
            print('\033[32mO COMPUTADOR GANHOU!!!\033[m\n')
        elif computador == 1:
            win += 1
            print('\033[33mO USUÁRIO GANHOU\033[m\n')
        elif computador == 2:
            empate += 1
            print('\033[36mEMPATOU!!!\033[m\n')
    while resp not in 'SN':
        resp = str(input('Quer continuar [S/N]: ')).strip()[0].upper()
        if resp == 'N':
            print(f'''Voçe parou de jogar e o placar era de 
        \033[32mCOMPUTADOR\033[m {winpc}
        \033[33mUSUARIO\033[m {win}
        \033[36mEMPATE\033[m {empate}''')
            break
        os.system('cls')
if win == 5:
    print('\033[33mO USUÁRIO GANHOU!!!\033[m')
elif winpc == 5:
    print('\033[32mO COMPUTADOR GANHOU!!!\033[m')
print('FIM DO JOGO !!!')
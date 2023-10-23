import openpyxl
import pyperclip
import pyautogui
from time import sleep
# - Rodar usando esse link https://cadastro-produtos-devaprender.netlify.app/index.html
#- zoom em 90%

#- Entrar na planilha

Workbook = openpyxl.load_workbook('produtos_ficticios.xlsx')
sheet_produtos = Workbook['Produtos']

#- Copiar informação de um campo e colar no seu campo correspondente
#- Repetir esses passos para outros campos até preencher campos daquela página

for linha in sheet_produtos.iter_rows(min_row=2):
    nome_produto = (linha[0].value)
    pyperclip.copy(nome_produto)
    pyautogui.click(112,214,duration=1)
    pyautogui.hotkey('ctrl', 'v')

    descricao_produto = (linha[1].value)
    pyperclip.copy(descricao_produto)
    pyautogui.click(107,293,duration=1)
    pyautogui.hotkey('ctrl', 'v')

    categoria_produto = (linha[2].value)
    pyperclip.copy(categoria_produto)
    pyautogui.click(105,414,duration=1)
    pyautogui.hotkey('ctrl', 'v')

    codigo_do_produto = (linha[3].value)
    pyperclip.copy(codigo_do_produto)
    pyautogui.click(115,489,duration=1)
    pyautogui.hotkey('ctrl', 'v')

    peso_do_produto = (linha[4].value)
    pyperclip.copy(peso_do_produto)
    pyautogui.click(110,567,duration=1)
    pyautogui.hotkey('ctrl', 'v')

    dimenssoes_do_produto = (linha[5].value)
    pyperclip.copy(dimenssoes_do_produto)
    pyautogui.click(113,649,duration=1)
    pyautogui.hotkey('ctrl', 'v')

# - clicar em Próximo
    pyautogui.click(125,699,duration=1)
    sleep(1)

    preco_do_produto = (linha[6].value)
    pyperclip.copy(preco_do_produto)
    pyautogui.click(112,237,duration=1)
    pyautogui.hotkey('ctrl','v')

    quantidade_do_produto = (linha[7].value)
    pyperclip.copy(quantidade_do_produto)
    pyautogui.click(114,317,duration=1)
    pyautogui.hotkey('ctrl','v')

    data_de_validade_do_produto = (linha[8].value)
    pyperclip.copy(data_de_validade_do_produto)
    pyautogui.click(114,389,duration=1)
    pyautogui.hotkey('ctrl','v')

    cor_do_produto = (linha[9].value)
    pyperclip.copy(cor_do_produto)
    pyautogui.click(115,470,duration=1)
    pyautogui.hotkey('ctrl','v')

    tamanho_do_produto = (linha[10].value)
    pyautogui.click(133,542,duration=1)
    if tamanho_do_produto == 'Pequeno':
        pyautogui.click(192,571,duration=1)
    elif tamanho_do_produto == 'Médio':
        pyautogui.click(183,591,duration=1)
    else:
        pyautogui.click(163,612,duration=1)

    material_do_produto = (linha[11].value)
    pyperclip.copy(material_do_produto)
    pyautogui.click(119,626,duration=1)
    pyautogui.hotkey('ctrl','v')


# - Clicar novamente em Próximo

    pyautogui.click(138,676,duration=1)
    sleep(1)

    fabricante_do_produto = (linha[12].value)
    pyperclip.copy(fabricante_do_produto)
    pyautogui.click(112,257,duration=1)
    pyautogui.hotkey('ctrl','v')

    pais_de_origem_do_produto = (linha[13].value)
    pyperclip.copy(pais_de_origem_do_produto)
    pyautogui.click(114,331,duration=1)
    pyautogui.hotkey('ctrl','v')

    observacoes_do_produto = (linha[14].value)
    pyperclip.copy(observacoes_do_produto)
    pyautogui.click(119,419,duration=1)
    pyautogui.hotkey('ctrl','v')

    codigo_de_barra_do_produto = (linha[15].value)
    pyperclip.copy(codigo_de_barra_do_produto)
    pyautogui.click(114,532,duration=1)
    pyautogui.hotkey('ctrl','v')

    localizacao_do_produto = (linha[16].value)
    pyperclip.copy(localizacao_do_produto)
    pyautogui.click(116,604,duration=1)
    pyautogui.hotkey('ctrl','v')

# - Clicar em Concluir 
    pyautogui.click(138,657,duration=1)
#- Clicar em ok, para finalizar o processo 
    pyautogui.click(856,167,duration=1)
    sleep(1)
    pyautogui.click(856,167,duration=1)
# - Clicar em Adicionar mais um e vai reiniciar todo o processo...
    pyautogui.click(679,455,duration=1)


from datetime import date


class Pessoa:

    ano_atual = date.today().year

    def __init__(self, nome, idade, comendo=False, falando=False):
        self.nome = nome
        self.idade = idade
        self.comendo = comendo
        self.falando = falando 

    def comer(self, alimento):
        if self.comendo:
            
            print(f'{self.nome} já está comendo.')
            return
        if self.falando:
            print(f'{self.nome} não pode comer falando.')
            return
        print(f'{self.nome} está comendo {alimento}')
        self.comendo = True
        
    def parar_de_comer(self):
        if not self.comendo:
            print(f'{self.nome} não está comendo.')
            return
        print(f'{self.nome} parou de comer')
        self.comendo = False 

    def falar(self, assunto):
        if self.comendo:
            print(f'{self.nome} não pode falar comendo.')
            return
        if self.falando:
            print(f'{self.nome} está falando.')
            return
        print(f'{self.nome} está falando sobre {assunto}')
        self.falando = True
        
    def parar_de_falar(self):
        if not self.falando:
            print(f'{self.nome} não está falando')
            return
        print(f'{self.nome} parou de falar.')
        self.falando = False
        return
    
    def ano_nascimento(self):
        return self.ano_atual - self.idade
    

    # CRIANDO METODO DA CLASSE
    @classmethod
    def por_ano_de_nascimento(cls, nome, ano_nascimento):
        idade = cls.ano_atual - ano_nascimento
        return cls(nome, idade)

p0 = Pessoa.por_ano_de_nascimento(str(input('Digite seu nome: ')), int(input('Digite sua idade: ')))

print(f"{p0.nome} nasceu em {p0.idade}")
p0.comer('Pão com carne')
p0.falar('nada')
p0.parar_de_comer()
p0.falar('Estou aprendendo Programação')


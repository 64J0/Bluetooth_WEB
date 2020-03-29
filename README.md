# TCC - Bluetooth Low Energy WEB

Esse repositório será usado para armazenar os códigos referentes à parte computacional do meu Trabalho de Conclusão de Curso, denominado "<i>Caracterização de uma bancada didática para estudos de dinâmica, vibrações e manutenção</i>".

Um dos objetivos do trabalho é desenvolver uma interface computacional para que o usuário do sistema possa visualizar os dados obtidos pelos sensores na planta real. Para medir a vibração ocorrida no sistema (rotor desbalanceado, <i>Jeffcott rotor</i>) será usado um acelerômetro digital desenvolvido pela <a href="https://www.hedro.com.br/">HEDRO</a>.

O firmware do sensor foi implementado segundo as regras do protocolo <strong>Bluetooth Low Energy</strong> (<i>BLE</i>) visando aumentar o tempo de duração da bateria. As comunicações entre o <i>desktop</i> (<i>browser</i>) e o equipamento de medição se dá através de uma interface UART.

A figura abaixo demonstra alguns resultados iniciais, onde estão sendo comparados os gráficos gerados a partir de dados coletados pelo sensor com uma fonte de excitação de 200 Hz aproximadamente. À esquerda temos um gráfico gerado em <i>python</i> usando a <i>matplotlib</i> e a direita temos o gráfico gerado usando <i>javascript</i> e a <i>chartjs</i>.

![Figura onde são comparados dois gráficos com resultados de medições pelo sensor](https://github.com/64J0/Bluetooth_WEB/blob/master/assets-github/comparacao_resultados.jpeg)

Vinícius Gajo Marques Oliveira, 2020.

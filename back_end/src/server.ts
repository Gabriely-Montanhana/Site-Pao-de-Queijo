import express from 'express';

const app = express();

//Fazer a conexão com o banco de dados

app.get('/', (req, res) => {
    res.send('Hello World avengers assemble!');
});

app.post('/outra', (req, res) => {
    res.send('Hello World na outra rota!');
});

app.listen(3000, 
    () => console.log("Rodando em <http://localhost:3000>")
);
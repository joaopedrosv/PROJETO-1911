const express = require("express");
const mysql = require("mysql");
const bodyParser = require("body-parser");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const session = require("express-session");

const app = express();
const port = 3000;

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

const db = mysql.createConnection({
    host: "192.168.171.210",
    user: "joao.pedro",
    password: "J@ao.P3dro",
    database: "bd-givas_company",
    acquireTimeout: 50000,
    connectTimeout: 50000,
    waitForConnections: true,
    queueLimit: 0,
});

db.connect((err) => {
    if (err) {
        console.error("Erro ao conectar ao banco de dados:", err);
        return;
    }
    console.log("Conectado ao banco de dados MySQL");
});

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true,
}));

app.post('/verificar-uid', (req, res) => {
    const { uid } = req.body;

    if (!uid) {
        return res.status(400).json({ message: 'UID não fornecido' });
    }

    // Verificar o status da solicitação
    const querySolicitacao = `
        SELECT usuarios.id AS aluno_id, solicitacoes_saida.status, solicitacoes_saida.id AS solicitacao_id
        FROM usuarios
        LEFT JOIN solicitacoes_saida ON usuarios.id = solicitacoes_saida.aluno_id
        WHERE usuarios.uid = ?
    `;

    db.query(querySolicitacao, [uid], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Erro ao consultar a solicitação', error: err });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado ou sem solicitação' });
        }

        const { aluno_id, status, solicitacao_id } = results[0];

        // Lógica para determinar o que fazer com base no status
        if (status === 'aceito') {
            // Atualizar para 'fora_sala' e registrar a hora de saída
            const queryUpdateStatus = `
                UPDATE solicitacoes_saida SET status = 'fora_sala' WHERE id = ?
            `;
            const queryInsertRegistro = `
                INSERT INTO registros_qrcode (aluno_id, solicitacao_id, hora_saida)
                VALUES (?, ?, NOW())
            `;

            db.query(queryUpdateStatus, [solicitacao_id], (err) => {
                if (err) {
                    return res.status(500).json({ message: 'Erro ao atualizar status', error: err });
                }

                db.query(queryInsertRegistro, [aluno_id, solicitacao_id], (err) => {
                    if (err) {
                        return res.status(500).json({ message: 'Erro ao registrar a saída', error: err });
                    }

                    res.json({ message: 'Saída registrada com sucesso!' });
                });
            });

        } else if (status === 'fora_sala') {
            // Atualizar para 'nulo' e registrar a hora de retorno
            const queryUpdateStatus = `
                UPDATE solicitacoes_saida SET status = 'nulo' WHERE id = ?
            `;
            const queryUpdateRegistro = `
                UPDATE registros_qrcode SET hora_retorno = NOW() WHERE aluno_id = ? AND solicitacao_id = ? AND hora_retorno = '0000-00-00 00:00:00'
            `;

            db.query(queryUpdateStatus, [solicitacao_id], (err) => {
                if (err) {
                    return res.status(500).json({ message: 'Erro ao atualizar status', error: err });
                }

                db.query(queryUpdateRegistro, [aluno_id, solicitacao_id], (err) => {
                    if (err) {
                        return res.status(500).json({ message: 'Erro ao registrar o retorno', error: err });
                    }

                    res.json({ message: 'Retorno registrado com sucesso!' });
                });
            });
        } else {
            res.status(400).json({ message: 'O status do aluno não permite esta ação' });
        }
    });
});


app.get('/aceitar-recusar', (req, res) => {
    const query = `SELECT usuarios.nome, solicitacoes_saida.aluno_id
                   FROM usuarios
                   JOIN solicitacoes_saida ON usuarios.id = solicitacoes_saida.aluno_id
                   WHERE solicitacoes_saida.status = 'solicitado'`;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Erro na consulta ao banco de dados:', err);
            return res.status(500).send('Erro no banco de dados');
        }
        res.json(results);
    });
});

app.post('/cadastrar-usuario', upload.single('foto'), (req, res) => {
    const { nome, matricula, tipo_usuario, email, senha, uid } = req.body;
    const foto = req.file ? req.file.filename : null;

    if (!nome || !matricula || !tipo_usuario || !email || !senha || !uid) {
        return res.json({ success: false, message: 'Todos os campos são obrigatórios' });
    }

    const query = `INSERT INTO usuarios (nome, matricula, tipo_usuario, email, senha, uid, foto) VALUES (?, ?, ?, ?, ?, ?, ?)`;

    db.query(query, [nome, matricula, tipo_usuario, email, senha, uid, foto], (err, result) => {
        if (err) {
            console.error('Erro ao inserir usuário no banco de dados:', err);
            return res.json({ success: false, message: 'Erro ao cadastrar usuário' });
        }
        res.json({ success: true });
    });
});

app.post('/aceitar-solicitacao', (req, res) => {
    const { alunoId } = req.body;

    if (!alunoId) {
        return res.status(400).send('ID do aluno não fornecido');
    }

    const query = 'UPDATE solicitacoes_saida SET status = ? WHERE aluno_id = ?';
    db.query(query, ['aceito', alunoId], (err, results) => {
        if (err) {
            console.error('Erro ao atualizar o status:', err);
            return res.status(500).send('Erro ao atualizar o status');
        }
        res.send('Solicitação aceita com sucesso');
    });
});

app.post('/recusar-solicitacao', (req, res) => {
    const { alunoId } = req.body;

    if (!alunoId) {
        return res.status(400).send('ID do aluno não fornecido');
    }

    const query = 'UPDATE solicitacoes_saida SET status = ? WHERE aluno_id = ?';
    db.query(query, ['nulo', alunoId], (err, results) => {
        if (err) {
            console.error('Erro ao atualizar o status:', err);
            return res.status(500).send('Erro ao atualizar o status');
        }
        res.send('Solicitação recusada com sucesso');
    });
});

app.get("/status-alunos", (req, res) => {
    const query = `
        SELECT usuarios.nome, solicitacoes_saida.status 
        FROM usuarios 
        LEFT JOIN solicitacoes_saida ON usuarios.id = solicitacoes_saida.aluno_id
        WHERE solicitacoes_saida.status IN ('solicitado', 'aceito', 'fora_sala')
        ORDER BY 
            CASE
                WHEN solicitacoes_saida.status = 'fora_sala' THEN 1
                WHEN solicitacoes_saida.status = 'aceito' THEN 2
                WHEN solicitacoes_saida.status = 'solicitado' THEN 3
                ELSE 4
            END,
            usuarios.nome
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error("Erro na consulta ao banco de dados:", err);
            return res.status(500).send("Erro no banco de dados");
        }
        res.json(results);
    });
});

app.post('/login', (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({ success: false, message: 'E-mail e senha são obrigatórios' });
    }

    const query = 'SELECT * FROM usuarios WHERE email = ? AND senha = ?';

    db.query(query, [email, senha], (err, results) => {
        if (err) {
            console.error('Erro ao consultar o banco de dados:', err);
            return res.status(500).json({ success: false, message: 'Erro no servidor' });
        }

        if (results.length > 0) {
            req.session.user = results[0];
            res.json({ success: true, redirectTo: 'index.html' });
        } else {
            res.status(401).json({ success: false, message: 'E-mail ou senha inválidos' });
        }
    });
});

app.get('/pagina-principal', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/');
    }
    res.send('Bem-vindo à página principal');
});

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});

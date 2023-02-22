const express = require('express')
const multer = require('multer')
const bcrypt = require('bcrypt')
const multerConfig = require('./config/multer')
const jwt = require('jsonwebtoken')
const { body, validationResult } = require('express-validator')
const routes = express.Router()

const User = require('./models/User')
const BoxController = require('./controllers/BoxController')
const FileController = require('./controllers/FileController')
const SessionController = require('./controllers/SessionController')

// Adiciona validações
const registerValidations = [
  body('email').isEmail().withMessage('Endereço de email inválido'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('A senha deve ter no mínimo 8 caracteres'),
]

// Adiciona validações
const loginValidations = [
  body('email').isEmail().withMessage('Endereço de email inválido'),
  body('password').notEmpty().withMessage('Senha não pode estar vazia'),
]

// Rota para registrar novo usuário
routes.post('/register', registerValidations, async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() })
    }

    const { email, password } = req.body

    // Verifica se o usuário já existe
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res
        .status(409)
        .json({ message: 'O endereço de email já está em uso' })
    }

    const user = new User({ email, password })
    await user.save()

    res.status(201).json(user)
  } catch (error) {
    next(error)
  }
})

// Rota para autenticar usuário
routes.post('/login', loginValidations, async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() })
    }

    const { email, password } = req.body

    // Busca usuário no banco de dados
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(401).json({ message: 'Credenciais inválidas' })
    }

    // Verifica se a senha está correta
    const passwordMatch = await bcrypt.compare(password, user.password)
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Credenciais inválidas' })
    }

    // Atualiza o contador de acessos do usuário
    user.accessCount = (user.accessCount || 0) + 1
    await user.save()

    // Gera token de autenticação
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '5d',
    })

    res.status(200).json({ user, token })
  } catch (error) {
    next(error)
  }
})

routes.post('/:id/logout', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '')

  if (!token) {
    return res.status(401).json({ message: 'Não autorizado' })
  }

  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decodedToken.id)

    if (!user) {
      return res.status(401).json({ message: 'Não autorizado' })
    }

    // Remove o token do usuário e salva no banco de dados
    user.tokens = user.tokens.filter((t) => t.token !== token)
    await user.save()

    res.json({ message: 'Logout bem-sucedido' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

routes.get('/users', async (req, res) => {
  const users = await User.find().select('-password')
  try {
    const users = await User.findAll()
    res.json(users)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

routes.post('/sessions', SessionController.store)
routes.post('/boxes', BoxController.store)
routes.get('/boxes/:id', BoxController.show)

routes.post(
  '/boxes/:id/files',
  multer(multerConfig).single('file'),
  FileController.store,
)

module.exports = routes

const User = require('../models/User')
const bcrypt = require('bcrypt')

module.exports = {
  async store(req, res) {
    const { email, password } = req.body

    try {
      const user = await User.findOne({ email })

      if (!user) {
        return res.status(401).json({ message: 'E-mail ou senha incorretos.' })
      }

      const isPasswordValid = await bcrypt.compare(password, user.password)

      if (!isPasswordValid) {
        return res.status(401).json({ message: 'E-mail ou senha incorretos.' })
      }

      return res.json(user)
    } catch (error) {
      return res.status(500).json({ message: 'Erro interno do servidor.' })
    }
  },
}

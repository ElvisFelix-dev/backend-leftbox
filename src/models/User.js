const mongoose = require('mongoose')
const bcrypt = require('bcrypt')

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: async function (email) {
        const user = await this.constructor.findOne({ email })
        if (user) {
          if (this.id === user.id) {
            return true
          }
          return false
        }
        return true
      },
      message: (props) => 'O email informado já está sendo usado!',
    },
  },

  password: {
    type: String,
    required: true,
    minLength: 8, // senha deve ter pelo menos 8 caracteres
    select: false, // não selecionar por padrão
  },

  isAdmin: {
    type: Boolean,
    default: false,
  },

  accessCount: {
    type: Number,
    default: 0,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
})

UserSchema.statics.findAll = async function () {
  return this.find({})
}

UserSchema.pre('save', async function (next) {
  const user = this

  if (user.isModified('password')) {
    try {
      const salt = await bcrypt.genSalt(10)
      const hash = await bcrypt.hash(user.password, salt)
      user.password = hash
    } catch (error) {
      return next(error)
    }
  }

  next()
})

module.exports = mongoose.model('User', UserSchema)

'use strict'

const User = use('App/Models/User')
const Env = use('Env')
const Mail = use('Mail')

const RequestPassHook = exports = module.exports = {}

RequestPassHook.sendEmail = async (requestPass) => {
  const user = await User.findBy('id', requestPass.user_id)
  const link = `${Env.get('LINK_SET_NEW_PASS')}?token=${requestPass.key}`
  Mail.send('emails.requestNewpass', { name: user.name, link }, (message) => {
    message
      .to(user.email)
      .from('<from-email>')
      .subject('SLRX - UFC | Recuperação de Senha')
  })
}

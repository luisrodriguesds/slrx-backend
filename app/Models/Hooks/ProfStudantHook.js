'use strict'

const Env = use('Env')
const Mail = use('Mail')
const User = use('App/Models/User')

const ProfStudantHook = exports = module.exports = {}

ProfStudantHook.sendEmail = async (profStudant) => {
  const professor = await User.query().select('id', 'email').where('id', profStudant.professor_id).first()
  const studant = await User.query().select('id', 'email', 'name').where('id', profStudant.studant_id).first()
  
  const buff = new Buffer(studant.email)
  const buff2 = new Buffer(professor.email)
  const linkBond = `${Env.get('APP_URL_PROD')}/api/user/confirm-bond?email=${buff.toString('base64')}&&email_leader=${buff2.toString('base64')}`
  Mail.send('emails.professorConfirmStudant', { linkBond, email:studant.email, name:studant.name}, (message) => {
    message
        .to(professor.email)
        .from('<from-email>')
        .subject('SLRX - UFC | Confirmação de Vínculo')
  })
}

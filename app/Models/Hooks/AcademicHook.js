'use strict'

const Env = use('Env')
const Mail = use('Mail')

const AcademicHook = exports = module.exports = {}

AcademicHook.sendEmail = async (academic) => {
  const user = await academic.user().fetch()

  if (user.access_level_slug != 'professor') {
    return
  }

  const buff = new Buffer(user.email)
  const linkConfirm = `${Env.get('APP_URL_PROD')}/api/user/confirm-user?email=${buff.toString('base64')}&confirm=true`;
  const linkNoConfirm = `${Env.get('APP_URL_PROD')}/api/user/confirm-user?email=${buff.toString('base64')}&confirm=false`;
  const send = {
    linkConfirm, 
    linkNoConfirm, 
    email:user.email, 
    name:user.name,
    ies: academic.ies,
    department: academic.department,
    laboratory: academic.laboratory,
    research: academic.research,
    description: academic.description
  }
  
  Mail.send('emails.professorConfirm', send, (message) => {
    message
      .to(Env.get('MAIL_RESPONSIBLE'))
      .from('<from-email>')
      .subject('SLRX - UFC | Confirmação de Cadastro de Professor')
  })
  
}

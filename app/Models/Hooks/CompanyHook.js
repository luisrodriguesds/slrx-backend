'use strict'

const Mail = use('Mail')
const Env = use('Env')

const CompanyHook = exports = module.exports = {}

CompanyHook.sendEmail = async (companyUser) => {
  const user = await companyUser.user().fetch()
  const company = await companyUser.company().fetch()

  const buff = new Buffer(user.email)
  const linkConfirm = `${Env.get('APP_URL_PROD')}/api/user/confirm-user?email=${buff.toString('base64')}&confirm=true`;
  const linkNoConfirm = `${Env.get('APP_URL_PROD')}/api/user/confirm-user?email=${buff.toString('base64')}&confirm=false`;
  const send = {
    linkConfirm, 
    linkNoConfirm, 
    company,
    access_level: user.access_level,
    name: user.name,
    email: user.email
  }
  
  Mail.send('emails.companyConfirm', send, (message) => {
    message
      .to(Env.get('MAIL_RESPONSIBLE'))
      .from('<from-email>')
      .subject('SLRX - UFC | Confirmação de Cadastro de Empresa')
  })
}

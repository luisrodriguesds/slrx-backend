'use strict'
const Solicitation = use('App/Models/Solicitation')
const dateformat = use('dateformat')
const Database = use('Database')
class StatisticController {
  async samples({ request, response }){
    const { period='day', value=7 } = request.all()

    let queryStatistic
    let data = new Date(), arr_date = [], count_drx=0, arr_count_drx=[], count_frx=0, arr_count_frx=[]
    switch (period) {
      case 'day':
        [queryStatistic, ] = await Database.raw(`SELECT name, created_at, method, COUNT(*) FROM solicitations WHERE created_at BETWEEN DATE_ADD(CURDATE(), INTERVAL -${value} DAY) AND DATE_ADD(CURDATE(), INTERVAL + 1 DAY) GROUP BY DAY(created_at) HAVING COUNT(*) > 1 ORDER BY created_at DESC`)

        for (let i = Number(value); i >= 0; i--) {
            data.setDate(data.getDate() - i)
            count_drx = queryStatistic.filter(v => (dateformat(v.created_at, 'dd/mm') == dateformat(data, 'dd/mm') && v.method == 'DRX' ) )
            count_frx = queryStatistic.filter(v => (dateformat(v.created_at, 'dd/mm') == dateformat(data, 'dd/mm') && v.method == 'FRX' ) )
            arr_date.push(dateformat(data, 'dd/mm'))
            arr_count_frx.push(count_frx.length != 0 ? count_frx[0]['COUNT(*)'] : 0)
            arr_count_drx.push(count_drx.length != 0 ? count_drx[0]['COUNT(*)'] : 0)
            data = new Date()
        }

        return response.status(200).json({
          arr_date,
          arr_count_drx,
          arr_count_frx
        })

        break;

      default:
        //Parei em mostrar resultado de cada mês
        [queryStatistic, ] = await Database.raw(`SELECT name, created_at, method, COUNT(*) FROM solicitations WHERE method = 'DRX' AND created_at BETWEEN DATE_ADD(CURDATE(), INTERVAL -366 DAY) AND DATE_ADD(CURDATE(), INTERVAL + 1 DAY) GROUP BY MONTH(created_at) HAVING COUNT(*) > 1 ORDER BY created_at DESC`)
        let [queryStatisticFRX, ] = await Database.raw(`SELECT name, created_at, method, COUNT(*) FROM solicitations WHERE method = 'FRX' AND created_at BETWEEN DATE_ADD(CURDATE(), INTERVAL -366 DAY) AND DATE_ADD(CURDATE(), INTERVAL + 1 DAY) GROUP BY MONTH(created_at) HAVING COUNT(*) > 1 ORDER BY created_at DESC`)
        for (let i = 12; i > 0; i--) {
          data.setMonth(data.getMonth() - i)
          count_drx = queryStatistic.filter(v => (dateformat(v.created_at, 'mm/yy') == dateformat(data, 'mm/yy') ) )
          count_frx = queryStatisticFRX.filter(v => (dateformat(v.created_at, 'mm/yy') == dateformat(data, 'mm/yy') ) )
          arr_date.push(dateformat(data, 'mmmm'))
          arr_count_frx.push(count_frx.length != 0 ? count_frx[0]['COUNT(*)'] : 0)
          arr_count_drx.push(count_drx.length != 0 ? count_drx[0]['COUNT(*)'] : 0)
          data = new Date()
        }

        return response.status(200).json({
          arr_date,
          arr_count_drx,
          arr_count_frx
        })
        break;
    }
  }

  async samples_year({ response }){
    const [queryDRX, ] = await Database.raw(`SELECT name, created_at, method, COUNT(*) FROM solicitations WHERE method = 'DRX' AND status > 5 GROUP BY YEAR(created_at) HAVING COUNT(*) > 1 ORDER BY created_at ASC`)
    const [queryFRX, ] = await Database.raw(`SELECT name, created_at, method, COUNT(*) FROM solicitations WHERE method = 'FRX' AND status > 5 GROUP BY YEAR(created_at) HAVING COUNT(*) > 1 ORDER BY created_at ASC`)

    let statistics = []
    for (let i = 2017; i <= (new Date().getFullYear()); i++) {
      const drx = queryDRX.filter(drx => dateformat(drx.created_at, 'yyyy') == i)
      const frx = queryFRX.filter(frx => dateformat(frx.created_at, 'yyyy') == i)

      statistics.push({
        year: i,
        drx: drx.length == 0 ? 0 : drx[0]['COUNT(*)'],
        frx: frx.length == 0 ? 0 : frx[0]['COUNT(*)']
      })

    }
    statistics.reverse()
    return response.json({
      statistics
    })
  }

  async sample_groups({ request, response }){
    const { year='until-now' } = await request.all()

    let query
    switch (year) {
      case 'until-now':
        [query, ] = await Database.raw(`SELECT u.id, u.name, u.email, u.access_level, a.laboratory, a.user_id, s.user_id, s.created_at, s.name, COUNT(*) FROM users as u, academic_data as a, solicitations as s WHERE u.access_level in ('Professor', 'Aluno') AND u.id = a.user_id AND s.status > 5 AND s.user_id = u.id GROUP BY a.laboratory HAVING COUNT(*) > 1`)
        return response.json({
          statistics: query
        })
        break;

      default:
        [query, ] = await Database.raw(`SELECT u.id, u.name, u.email, u.access_level, a.laboratory, a.user_id, s.user_id, s.created_at, s.name, COUNT(*) FROM users as u, academic_data as a, solicitations as s WHERE u.access_level in ('Professor', 'Aluno') AND u.id = a.user_id AND s.status > 5 AND s.user_id = u.id AND YEAR(s.created_at) = ${year} GROUP BY a.laboratory HAVING COUNT(*) > 1`)
        return response.json({
          statistics: query
        })
        break;
    }
  }

}

module.exports = StatisticController

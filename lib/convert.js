const uuid = require('uuid-random')
const { tmpdir } = require('os')
const { readFile, writeFile, unlink } = require('fs').promises
const util = require('util')
const exec = util.promisify(require('child_process').exec)
const { getExecutablePath, defaultArgs } = require('@shelf/aws-lambda-libreoffice')

module.exports = async (context, data) => {
  const loBinary = await getExecutablePath()
  const id = uuid()
  const documentFileName = `${tmpdir}/${id}.docx`
  const pdfFileName = `${tmpdir}/${id}.pdf`
  const documentData = Buffer.from(data, 'base64')

  try {
    await writeFile(documentFileName, documentData, 'binary')
    const { stdout } = await exec(`${loBinary} ${defaultArgs.join(' ')} --convert-to pdf ${documentFileName} --outdir ${tmpdir}`)
    context.log(stdout)
    const pdf = await readFile(pdfFileName).toString('base64')
    await unlink(pdfFileName)
    context.log(`Deleted ${pdfFileName}`)
    await unlink(documentFileName)
    context.log(`Deleted ${documentFileName}`)
    return pdf
  } catch (error) {
    context.log.error(error)
  }
}

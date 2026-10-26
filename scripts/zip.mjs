import zip from 'bestzip'

await zip({ source: '*', destination: '../social-warm.zip', cwd: 'dist' })
console.log('social-warm.zip written in the project root — upload it to the Chrome Web Store')

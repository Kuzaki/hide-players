const S = require('./string')

module.exports = function HidePlayers(dispatch) {
  let hidden = false
  let visibleRange = 2500

  dispatch.hook('C_WHISPER', 1, chatHook)
  dispatch.hook('C_CHAT', 1, chatHook)
  dispatch.hook('C_SET_VISIBLE_RANGE', 1, event => visibleRange = event.range)
  dispatch.hook('S_SPAWN_USER', 1, () => { if (hidden) return false })

  function chatHook(event) {
    const args = S.decodeHTMLEntities(S.stripTags(event.message))
      .split(/\s+/)
    const arg = args.reduce((out, part) => {
      if (part.toLowerCase() === '!hide') return true
      if (out === true) return part
      return out
    }, false)

    if (arg) {
      evaluateArg(arg)
      return false
    }
  }

  function evaluateArg(arg) {
    switch (arg) {
      case 'on':
        hidden = true
        break
      case 'off':
        hidden = false
        break
      default:
        hidden = !hidden
    }

    refreshNearbyPlayers()
  }

  function refreshNearbyPlayers() {
    dispatch.toServer('C_SET_VISIBLE_RANGE', 1, { range: 1 })
    setTimeout(() => {
      dispatch.toServer('C_SET_VISIBLE_RANGE', 1, { range: visibleRange })
    }, 1000)
  }

  // debug
  // refreshNearbyPlayers()

  // slash support
  try {
    const Slash = require('slash')
    const slash = new Slash(dispatch)
    slash.on('hide', args => {
      evaluateArg(args[1])
      slash.print('[hide-players] ' + (hidden ? 'enabled' : 'disabled'))
    })
  } catch (e) {
    // do nothing because slash is optional
  }
}

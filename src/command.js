class Command {
  constructor (name, callback) {
    this.name = name
    this.callback = callback
  }

  get matcher () {
    return /^\/([\w]+)\b *(.*)?$/m
  }

  listener (context) {
    const command = context.payload.comment.body.match(this.matcher)
    //for issue
    const command = context.payload.issue.body.match(this.matcher)

    if (command && this.name === command[1]) {
      return this.callback(context, {name: command[1], arguments: command[2]})
    }
  }
}

module.exports = (robot, triggers, name, callback) => {
  const command = new Command(name, callback)
  robot.on(triggers, command.listener.bind(command))
}

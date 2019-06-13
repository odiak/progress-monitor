# Progress Monitor

This is a simple tool that visualize progress of any program on browser.

## Example

![](https://i.gyazo.com/9f01b7b554f9b9034a20ba7309be548a.png)

## How to use

```bash
# Install
npm install -g @odiak/progress-monitor

# Execute with pipe
your-program | progress-monitor
```

All you need to do is let your program to print JSON in one line on each step of process.

Format of JSON to output is [here](https://github.com/odiak/progress-monitor/blob/master/src/client/index.tsx#L21-L27) and here is its example below (they're pretty printed, but actual JSON must be one-line):

```json
{
  "variant": "experiment 1",
  "metric": "error",
  "value": { "test": 0.0321, "train": 0.0188 },
  "epoch": 11,
  "n_epochs": 400
}
```

```json
{
  "variant": "experiment 1",
  "metric": "time",
  "value": 0.313,
  "epoch": 11,
  "n_epochs": 400
}
```

## License

MIT

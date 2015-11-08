// from stdout!'Hello World' → STOP

package main

import "fmt"

func stdoutProcess(output chan string) {
  for {
    str, more := <- output
    if more {
      fmt.Println(str)
    } else {
      return
    }
  }
}

func main(){
  stdout := make(chan string)

  go stdoutProcess(stdout)

  stdout <- "Hello World"
  close(stdout)
}

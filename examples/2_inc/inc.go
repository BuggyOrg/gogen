// STDIN >> INC >> STDOUT
// (preprocessing will make STDIN >> TO_INT >> INC >> TO_STRING >> STDOUT out of it)
// INC is an atomic process

package main

import "fmt"
import "strconv"
import "sync"

var wg sync.WaitGroup

func stdoutProcess(output chan string) {
  for {
    str, more := <- output
    if more {
      fmt.Println(str)
    } else {
      wg.Done()
      return
    }
  }
}

func stdinProcess(input chan string) {
  for {
    inputStr := ""
    fmt.Println("waiting for Input")
    _,err := fmt.Scanln(&inputStr)
    if err == nil {
      fmt.Println("got Input")
      fmt.Println(inputStr)
      input <- inputStr
    }
  }
}

func incProcess(input chan int, output chan int) {
  for {
    v := <- input
    output <- v + 1
  }
}

func string_to_int_process(input chan string, output chan int) {
  for {
    v := <- input
    i, err := strconv.Atoi(v)
    if err != nil {
      fmt.Println("could not parse")
    } else {
      output <- i
    }
  }
}

func int_to_string_process(input chan int, output chan string) {
  for {
    v := <- input
    output <- strconv.Itoa(v)
  }
}

func pipe_string(input chan string, output chan string) {
  for {
    s := <- input
    output <- s
  }
}

func pipe_int(input chan int, output chan int) {
  for {
    i := <- input
    output <- i
  }
}

func main() {
  stdout := make(chan string)
  stdin := make(chan string)

  wg.Add(1)
  go stdoutProcess(stdout)
  go stdinProcess(stdin)

  c2 := make(chan int) // string_to_int >> inc
  c3 := make(chan int) // inc >> int_to_string

  go string_to_int_process(stdin, c2)
  go incProcess(c2, c3)
  go int_to_string_process(c3, stdout)

  wg.Wait()
}

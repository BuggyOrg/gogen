// ((s1:STDIN) // (s2:STDIN) // ADD) >> STDOUT
// (preprocessing will make ((s1:STDIN >> TO_INT) // (s2:STDIN >> TO_INT) // ADD >> TO_STRING >> STDOUT out of it)
// INC is an atomic process

package main

import "fmt"
import "strconv"
import "sync"

var wg sync.WaitGroup

func stdoutProcess(output chan string) {
  for {
    str, _ := <- output
    fmt.Println(str)
  }
}

func stdinProcess(who string, input chan string) {
  for {
    inputStr := ""
    fmt.Println(who)
    _,err := fmt.Scanln(&inputStr)
    if err == nil {
      input <- inputStr
    } else {
      wg.Done()
      return
    }
  }
}

func addProcess(s1 chan int, s2 chan int, output chan int) {
  for {
    v1 := <- s1
    v2 := <- s2
    output <- v1 + v2
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
  stdin1 := make(chan string)
  stdin2 := make(chan string)

  go stdoutProcess(stdout)
  wg.Add(1)
  go stdinProcess("first", stdin1)
  wg.Add(1)
  go stdinProcess("second", stdin2)

  c2 := make(chan int) // string_to_int >> inc
  c3 := make(chan int) // string_to_int >> inc
  c4 := make(chan int) // inc >> int_to_string

  go string_to_int_process(stdin1, c2)
  go string_to_int_process(stdin2, c3)
  go addProcess(c2, c3, c4)
  go int_to_string_process(c4, stdout)

  wg.Wait()
}

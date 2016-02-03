package main

// imports
import "fmt"
import "sync"
import "strconv"

// processes
func stdinProcess(output chan string) {
  for {
    inputStr := ""
    _,err := fmt.Scanln(&inputStr)
    if err == nil {
      output <- inputStr
    } else {
      wg.Done()
      return
    }
  }
}

func stdoutProcess(input chan string) {
  for {
    str, _ := <- input
    fmt.Println(str)
  }
}

func addProcess(s1 chan int, s2 chan int, sum chan int) {
  for {
    v1 := <- s1
    v2 := <- s2
    sum <- v1 + v2
  }
}

func const1process(const1 chan int) {
  for {
    const1 <- 1
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

func main() {
var wg sync.WaitGroup
wg.Add(1)

// channels
chan1 := make(chan string)
chan2 := make(chan int)
chan3 := make(chan int)
chan4 := make(chan int)
chan5 := make(chan string)

wg.Wait()
}

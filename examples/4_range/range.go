// Main = STDIN >> RANGE >> STDOUT

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

func rangeProcess(s1 chan int, output chan []int) {
  for {
    length := <- s1
    arr := make([]int, length, length)
    for i := 0; i<length; i++ {
      arr[i] = i
    }
    output <- arr
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

func array_to_string_process(input chan []int, output chan string) {
  for {
    arr := <- input
    str := "[ "
    if len(arr) != 0 {
      str += strconv.Itoa(arr[0])
    }
    for i:=1; i<len(arr); i++ {
      str += ", " + strconv.Itoa(arr[i])
    }
    str += " ]"
    output <- str
  }
}


func main() {
  stdout := make(chan string)
  stdin := make(chan string)

  go stdoutProcess(stdout)
  wg.Add(1)
  go stdinProcess("enter a length: ", stdin)

  c2 := make(chan int) // string_to_int >> inc
  c3 := make(chan []int) // string_to_int >> inc

  go string_to_int_process(stdin, c2)
  go rangeProcess(c2, c3)
  go array_to_string_process(c3, stdout)

  wg.Wait()
}

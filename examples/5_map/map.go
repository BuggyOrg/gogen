// Simply adds 1 to every element in an array
// Main = STDIN >> RANGE >> MAP_PLUS_ONE >> STDOUT
// ?? Not completely clear... MAP_PLUS_ONE = ... MAP_PLUS_ONE to ensure
// its reusability. Otherwise it would be "dead" after one use (in CSP semantics)
// MAP_PLUS_ONE = fn:INC // MAP // MAP_PLUS_ONE
// there might be a MAP_PLUS_ONE function in the code? Or it could be possible
// to remove the overhead... ?


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

func incProcess(in chan int, out chan int) {
  for {
    v := <- in
    out <- v + 1
  }
}

func mapProcess(in chan []int, fn_left chan int, fn_right chan int, out chan []int) {
  for {
    arr := <- in
    arrOut := make([]int, len(arr), len(arr))
    for i:=0; i<len(arr); i++ {
      fn_left <- arr[i]
      arrOut[i] = <- fn_right
    }
    out <- arrOut
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
  c4 := make(chan int) // string_to_int >> inc
  c5 := make(chan int) // string_to_int >> inc
  c6 := make(chan []int) // string_to_int >> inc

  go string_to_int_process(stdin, c2)
  go rangeProcess(c2, c3)
  go incProcess(c4, c5)
  go mapProcess(c3, c4, c5, c6)
  go array_to_string_process(c6, stdout)

  wg.Wait()
}

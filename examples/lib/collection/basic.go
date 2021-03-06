
package collection

import "fmt"

func Unpack(input chan []int, output chan chan int) {
  for {
    arr := <- input
    iCh := make(chan int)
    output <- iCh
    go func() {
      for _, i := range arr {
	 	    iCh <- i
  		}
		  close(iCh)
    }()
  }
}

func UnpackFull(input chan []int, item chan chan int, idx chan chan int, lenStr chan chan int) {
  for {
    arr := <- input
    itemCh := make(chan int)
    idxCh := make(chan int)
    lenCh := make(chan int)
    item <- itemCh
    idx <- idxCh
    lenStr <- lenCh
    fmt.Println("Splitting: " , arr)
    go func() {
      length := len(arr)
      for idx, i := range arr {
        itemCh <- i
        idxCh <- idx
        lenCh <- length
  		}
		  close(itemCh)
      close(idxCh)
      close(lenCh)
    }()
  }
}

func Pack(input chan chan int, output chan []int) {
	for {
    iCh := <- input
    go func() {
      arr := []int{}
      for i := range iCh {
        arr = append(arr, i)
      }
      output <- arr
    }()
  }
}

func Last(input chan chan int, output chan int) {
  for {
    var last int
    iCh := <- input
    for i := range iCh {
      last = i
    }
    output <- last 
  }
}

func Length(input chan []int, output chan int) {
  for i := range input {
    output <- len(i)
  }
}

func Prepend(value chan int, arr chan []int, output chan []int) {
  for {
    v := <- value
    array := <- arr
    // prepend
    output <- append([]int{v}, array...)
  }
}


func First(input chan []int, output chan int, cur int) {
  fmt.Println("created First -- ", cur)
  for i := range input {
    fmt.Println("First : ", i, " -- ", cur)
    output <- i[0]
  }
  close(output)
}

func Rest(input chan []int, output chan []int) {
  for i := range input {
    if len(i) > 1 {
      output <- i[1:]
    } else {
      output <- []int{}
    }
  }
  close(output)
}

func Empty(input chan []int, output chan bool) {
  for i := range input {
    output <- (len(i) == 0)
  }
  close(output)
}

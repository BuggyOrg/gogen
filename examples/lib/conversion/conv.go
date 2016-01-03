
package conversion

import "fmt"
import "strconv"
import "strings"

func Int2String(input chan int, output chan string) {
  for v := range input{
    output <- strconv.Itoa(v)
  }
  close(output)
}

func String2Int(input chan string, output chan int) {
  for v := range input {
    i, err := strconv.Atoi(v)
    if err != nil {
      fmt.Println("could not parse")
    } else {
      output <- i
    }
  }
  close(output)
}

func String2IntArray(input chan string, output chan []int) {
  for arrStr := range input {
    strArr := strings.Split(arrStr, ",")
    var arr = []int{}
    for _, str := range strArr {
      i, err := strconv.Atoi(str)
      if err != nil {
        fmt.Println("could not parse")
      } else {
        arr = append(arr, i)
      }
    }
    output <- arr
  }
  close(output)
}

func IntArray2String(input chan []int, output chan string) {
  for arr := range input {
    var strArr = []string{}
    for _, i := range arr {
      strArr = append(strArr, strconv.Itoa(i))
    }
    output <- strings.Join(strArr,",")
  }
  close(output)
}



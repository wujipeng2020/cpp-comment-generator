#include <stdexcept>
namespace tmp {

/**
 * @brief a brief description of this class
 * @author wujipeng@bytedance.com
 * @since 2020-06-01 
*/
class Demo {
 public:
  /**
   * @brief a brief description of this member function
   * @param x blah-blah
   * @param y yada-yada
   * @return the sum of x and y
   * @throw std::runtime_error on x < 0 || y < 0
   * @throw std::runtime_error on x + y == 9
   */
  int FooBar(int x, int y) {
    if (x < 0 || y < 0) throw std::runtime_error("duh");
    if (x + y == 9) throw std::runtime_error("9");
    return x + y;
  }
};

}  // namespace tmp
import { TextEditor, Position, Selection, TextLine } from 'vscode';

export class CppCommentGenerator {
  private author_: string;
  private editor_: TextEditor;

  // ============== public functions ====================

  constructor(activeEditor: TextEditor, author: string) {
    this.editor_ = activeEditor;
    this.author_ = author;
  }

  public InvalidLanguage(): boolean {
    return this.editor_.document.languageId !== 'cpp' && this.editor_.document.languageId !== 'c';
  }

  public WriteComments(): boolean {
    const cur_line = this.CurrentLine();
    if (cur_line.isEmptyOrWhitespace) { return false; }
    const offset = cur_line.firstNonWhitespaceCharacterIndex;
    console.log("cur line: " + cur_line.text);
    let s: string = cur_line.text.trim();


    if (s.startsWith("class")) { // selection is a class delcaration
      this.Insert(new Position(cur_line.lineNumber, 0), this.CommentClass(offset));
      this.Move(cur_line.lineNumber + 1, offset + 10);
      return true;
    } // otherwise, the selection should be either invalid or a func declaration

    // merge multiple lines if it's a multi-line declaration
    const kMaxLinesToDetect = 30;
    if (s.search(/[;{]/) === -1) {  // either multi-line or illegal 
      let next_line = cur_line;
      let i = 0;
      for (; i < kMaxLinesToDetect; i++) {
        next_line = this.GetLine(next_line.lineNumber + 1);
        let tmp = next_line.text.trim().replace(/[\n]/, '');
        s += tmp;
        if (tmp.search(/[;{]/) !== -1) { // declaration ends
          console.log("multi-line merged: " + s);
          break;
        }
      }
      if (i === kMaxLinesToDetect) { return false; }
    }

    let return_void = false;
    // skip static or extern, trim again 
    s = s.replace(/static/g, '').replace(/extern/g, '').replace(/const/g, '').replace(/[\&\*]/g, '').trim();
    if (s.startsWith("void")) {
      return_void = true;
    }
    const param_pos = s.search(/\(/);
    if (param_pos === -1) {
      return false;
    }

    s = s.substring(param_pos + 1);
    console.log("after preprocessing: " + s);
    // paralist walk start from the first (, and stops at the first ; or {.
    // C++ Function Declaration
    // 1. simple: type function(type param1, type param2, type param3)
    // 2. multi-line function declaration:
    // type function(type param1,
    //               type param2,
    //               type param3)
    // 3. a complicated example:
    // int f(int a = 7, int *p = nullptr, int (*(*x)(double))[3] = nullptr); 
    // 4. another example with commas
    // static std::pair<int, int> VecA(vector<MatchedItem>& items, unordered_map<i16, u16>& cnt_map)
    const kInType = 0;
    const kBetweenTypeParam = 1;
    const kInParam = 2;
    const kAfterParam = 3;
    const kAfterComma = 4;
    let status = kAfterComma;
    let nr_angle_brackets = 0; // number of '<'s 
    if (s.length <= 1) { return false; } // sanity check
    let parameters: string[] = [];
    let current_parameter: string = '';
    for (let i = 0; i < s.length; i++) { // detect parameters
      const c = s[i];
      if (c === '<') { // enter a template, should ignore commas now
        nr_angle_brackets++;
      } else if (c === '>') {
        nr_angle_brackets--;
      }
      if (nr_angle_brackets > 0) { continue; } // skip templates 
      if (c === ' ' || c === '\t' || c === '\r' || c === '\v' || c === '\f') { // whitespace
        if (status === kInType) {
          status = kBetweenTypeParam;
        } else if (status === kInParam) {
          status = kAfterParam;
        } // otherwise status remains unchanged
      } else if (c === ',' || c === ';' || c === '{') { // param ends
        if (status === kAfterComma) {
          return false; // sanity check 
        } else { // current parameter ends
          parameters.push(current_parameter);
          status = kAfterComma;
          current_parameter = ''; // clear current parameter
        }
        if (c === ';' || c === '{') { break; } // declaration ends
      } else { // non-whitespace except ;,{
        if (status === kBetweenTypeParam) {
          current_parameter += c;
          status = kInParam;
        } else if (status === kInParam) {
          current_parameter += c;
        } else if (status === kAfterComma) {
          status = kInType;
        } // otherewise status & current_parameter remain unchanged
      }
    }

    if (parameters.length > 0) { // remove the ) of last parameter	
      parameters[parameters.length - 1] = parameters[parameters.length - 1].replace(/[\)\(]/g, '').replace(/[^a-zA-Z0-9_$]/g, '');
    }
    this.Insert(new Position(cur_line.lineNumber, 0), this.CommentDeclaration(offset, return_void, parameters));
    this.Move(cur_line.lineNumber + 1, offset + 10);
    return true;
  }

  // ============== private functions ====================
  private CommentClass(offset: number): string {
    let s: string = '';
    let gen_white_space = ((nr_off: number) => {
      for (let i = 0; i < nr_off; i++) {
        s += ' ';
      }
    });
    gen_white_space(offset);
    s += '/**\n';
    gen_white_space(offset);
    s += ' * @brief \n';
    gen_white_space(offset);
    s += ' * @author ' + this.author_ + '\n';
    gen_white_space(offset);
    s += ' * @since ' + new Date().toDateString() + '\n';
    gen_white_space(offset);
    s += ' */\n';
    return s;
  }
  private CommentDeclaration(offset: number, return_void: boolean, parameters: string[]): string {
    let s: string = '';
    let gen_white_space = ((nr_off: number) => {
      for (let i = 0; i < nr_off; i++) {
        s += ' ';
      }
    });
    gen_white_space(offset);
    s += '/**\n';
    gen_white_space(offset);
    s += ' * @brief \n';
    for (let i = 0; i < parameters.length; i++) {
      gen_white_space(offset);
      s += ' * @param ';
      s += parameters[i];
      s += '\n';
    }
    gen_white_space(offset);
    s += ' * @return ';
    if (return_void) { s += '(void)'; }
    s += '\n';
    gen_white_space(offset);
    s += ' */\n';
    return s;
  }

  private GetLine(line_number: number): TextLine {
    return this.editor_.document.lineAt(line_number);
  }

  private CurrentLine(): TextLine {
    return this.GetLine(this.editor_.selection.active.line);
  }

  private Move(line: number, charcter: number): void {
    this.editor_.selection = new Selection(line, charcter, line, charcter);
  }

  private Insert(position: Position, text: string) {
    this.editor_.edit((editBuilder) => {
      editBuilder.insert(position, text);
    });
  }
}

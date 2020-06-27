import { TextEditor, Position, Selection, TextLine } from 'vscode';

export class ActiveEditor {

  private editor_: TextEditor;

  // ============== public functions ====================

  constructor(activeEditor: TextEditor) {
    this.editor_ = activeEditor;
  }

  public InvalidLanguage(): boolean {
    return this.editor_.document.languageId !== 'cpp' && this.editor_.document.languageId !== 'c';
  }

  public WriteComments(): boolean {
    const cur_line = this.CurrentLine();
    if (cur_line.isEmptyOrWhitespace) { return false; }
    const offset = cur_line.firstNonWhitespaceCharacterIndex;
    this.Insert(new Position(cur_line.lineNumber - 1, 0), this.GenComments(offset));
    this.Move(cur_line.lineNumber, offset + 10);
    return true;
  }

  // ============== private functions ====================

  private GenComments(offset : number) : string {
    let s : string = '';
    let gen_white_space = ((nr_off : number) => {
      for(let i = 0; i < nr_off; i++){
        s += ' ';
      }
    });
    gen_white_space(offset);
    s += '/**\n';
    gen_white_space(offset);
    s += ' * @param  \n';
    gen_white_space(offset);
    s += ' * @param  \n';
    gen_white_space(offset);
    s += ' * @return  \n';
    gen_white_space(offset);
    s += ' */';
    return s;
  }

  private CurrentLine(): TextLine {
    return this.editor_.document.lineAt(this.editor_.selection.active.line);
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

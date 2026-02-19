/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   test_lexer.c                                       :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: lraghave <lraghave@student.42singapore.sg> +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/01/26 15:00:00 by lraghave          #+#    #+#             */
/*   Updated: 2026/01/26 16:20:27 by lraghave         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

// Instructions
// command to compile: gcc -Wall -Wextra -Werror -no-pie test_lexer.c lexer.c lexer_helpers.c -L../../libft -lft -o test_lexer
// include lexer header file in all files and remove minishell.h from includes

#include <stdio.h>
#include "lexer.h"

static const char *token_type_to_string(t_token_type type)
{
	if (type == TOKEN_WORD)
		return "WORD";
	if (type == TOKEN_PIPE)
		return "PIPE";
	if (type == TOKEN_REDIRECT_IN)
		return "REDIRECT_IN";
	if (type == TOKEN_REDIRECT_OUT)
		return "REDIRECT_OUT";
	if (type == TOKEN_REDIRECT_APPEND)
		return "REDIRECT_APPEND";
	if (type == TOKEN_HEREDOC)
		return "HEREDOC";
	return "UNKNOWN";
}

static void print_tokens(t_token *list)
{
	t_token	*current;
	int		i;

	current = list;
	i = 0;
	printf("\n=== TOKENS ===\n");
	while (current)
	{
		printf("[%d] Type: %-15s", i, token_type_to_string(current->type));
		if (current->word)
			printf(" | Word: \"%s\"", current->word);
		printf("\n");
		current = current->next;
		i++;
	}
	printf("==============\n\n");
}

static void test_lexer(char *input, int test_num)
{
	t_token	*tokens;
	int		exit_status;

	exit_status = 0;
	printf("Test %d: \"%s\"\n", test_num, input);
	tokens = ft_lex(input, &exit_status);
	
	if (tokens)
	{
		print_tokens(tokens);
		ft_free_tokens(&tokens);
		printf("✓ Exit status: %d\n", exit_status);
	}
	else
	{
		printf("✗ Lexer failed! Exit status: %d\n", exit_status);
	}
	printf("----------------------------------------\n\n");
}

int main(void)
{
	int test_num = 1;

	printf("\n========================================\n");
	printf("    COMPREHENSIVE LEXER TEST SUITE\n");
	printf("========================================\n\n");

	printf(">>> BASIC COMMANDS <<<\n");
	test_lexer("echo hello", test_num++);
	test_lexer("ls", test_num++);
	test_lexer("cat file.txt", test_num++);
	test_lexer("ls -la -h", test_num++);

	printf("\n>>> PIPES <<<\n");
	test_lexer("ls | grep test", test_num++);
	test_lexer("cat file | grep hello | wc -l", test_num++);
	test_lexer("echo hello|cat", test_num++);  // No spaces around pipe
	test_lexer("|", test_num++);  // Just pipe
	test_lexer("| ls", test_num++);  // Pipe at start
	test_lexer("ls |", test_num++);  // Pipe at end

	printf("\n>>> INPUT REDIRECTION <<<\n");
	test_lexer("cat < input.txt", test_num++);
	test_lexer("cat<input.txt", test_num++);  // No spaces
	test_lexer("< file cat", test_num++);  // Redirection first
	test_lexer("<", test_num++);  // Just redirection

	printf("\n>>> OUTPUT REDIRECTION <<<\n");
	test_lexer("echo hello > output.txt", test_num++);
	test_lexer("ls>out.txt", test_num++);  // No spaces
	test_lexer(">", test_num++);  // Just redirection
	test_lexer("echo test > file1 > file2", test_num++);  // Multiple redirects

	printf("\n>>> APPEND REDIRECTION <<<\n");
	test_lexer("echo hello >> file.txt", test_num++);
	test_lexer("cat>>log.txt", test_num++);  // No spaces
	test_lexer(">>", test_num++);  // Just append

	printf("\n>>> HEREDOC <<<\n");
	test_lexer("cat << EOF", test_num++);
	test_lexer("cat<<EOF", test_num++);  // No spaces
	test_lexer("<<", test_num++);  // Just heredoc
	test_lexer("cat << 'EOF'", test_num++);  // Quoted delimiter
	test_lexer("cat << \"EOF\"", test_num++);  // Double quoted delimiter

	printf("\n>>> MIXED REDIRECTIONS <<<\n");
	test_lexer("< in > out", test_num++);
	test_lexer("cat < input.txt > output.txt", test_num++);
	test_lexer("< in >> out cat", test_num++);
	test_lexer("cat << EOF > outfile", test_num++);
	test_lexer("<input >output >>append <<HERE", test_num++);  // All together

	printf("\n>>> QUOTES - SINGLE <<<\n");
	test_lexer("echo 'hello world'", test_num++);
	test_lexer("echo 'hello'", test_num++);
	test_lexer("'ls -la'", test_num++);
	test_lexer("echo ''", test_num++);  // Empty quotes
	test_lexer("echo 'don't'", test_num++);  // Quote inside quote (unclosed)
	test_lexer("echo 'hello", test_num++);  // Unclosed quote (ERROR)

	printf("\n>>> QUOTES - DOUBLE <<<\n");
	test_lexer("echo \"hello world\"", test_num++);
	test_lexer("echo \"hello\"", test_num++);
	test_lexer("\"ls -la\"", test_num++);
	test_lexer("echo \"\"", test_num++);  // Empty quotes
	test_lexer("echo \"hello", test_num++);  // Unclosed quote (ERROR)

	printf("\n>>> QUOTES - MIXED <<<\n");
	test_lexer("echo \"hello 'world'\"", test_num++);  // Single inside double
	test_lexer("echo 'hello \"world\"'", test_num++);  // Double inside single
	test_lexer("echo \"hello\"'world'", test_num++);  // Adjacent quotes
	test_lexer("echo 'a'\"b\"'c'", test_num++);  // Multiple adjacent
	test_lexer("echo \"'\"", test_num++);  // Single quote inside double

	printf("\n>>> QUOTES WITH OPERATORS <<<\n");
	test_lexer("echo '|'", test_num++);  // Pipe in quotes
	test_lexer("echo \"|\"", test_num++);  // Pipe in double quotes
	test_lexer("echo '>'", test_num++);  // Redirect in quotes
	test_lexer("echo '<'", test_num++);
	test_lexer("echo '>>'", test_num++);
	test_lexer("echo '<<'", test_num++);

	printf("\n>>> WHITESPACE HANDLING <<<\n");
	test_lexer("echo    hello     world", test_num++);  // Multiple spaces
	test_lexer("   echo hello   ", test_num++);  // Leading/trailing spaces
	test_lexer("echo\thello", test_num++);  // Tab
	test_lexer("  \t  echo  \t  hello  \t  ", test_num++);  // Mixed whitespace
	test_lexer("", test_num++);  // Empty string
	test_lexer("   ", test_num++);  // Just spaces

	printf("\n>>> SPECIAL CHARACTERS <<<\n");
	test_lexer("echo $HOME", test_num++);
	test_lexer("echo $?", test_num++);
	test_lexer("echo $$", test_num++);
	test_lexer("echo ~", test_num++);
	test_lexer("echo *", test_num++);
	test_lexer("echo hello*world", test_num++);

	printf("\n>>> COMPLEX COMBINATIONS <<<\n");
	test_lexer("cat < input.txt | grep 'test' | wc -l > output.txt", test_num++);
	test_lexer("echo \"hello\" > 'file.txt'", test_num++);
	test_lexer("< in cat | grep test | sort | uniq > out", test_num++);
	test_lexer("echo 'a b c' | cat | cat | cat", test_num++);
	test_lexer("cat << 'EOF' | grep test >> log.txt", test_num++);

	printf("\n>>> EDGE CASES <<<\n");
	test_lexer("||||", test_num++);  // Multiple pipes
	test_lexer("<<<<", test_num++);  // Multiple redirects
	test_lexer(">>>>", test_num++);
	test_lexer("><><", test_num++);
	test_lexer("echo|", test_num++);  // Command then operator
	test_lexer("|echo", test_num++);  // Operator then command
	test_lexer("echo ''''''", test_num++);  // Many empty quotes
	test_lexer("echo \"\"\"\"\"\"", test_num++);  // Many empty double quotes

	printf("\n>>> REALISTIC MINISHELL COMMANDS <<<\n");
	test_lexer("export PATH=/usr/bin", test_num++);
	test_lexer("cd /tmp", test_num++);
	test_lexer("pwd", test_num++);
	test_lexer("env | grep PATH", test_num++);
	test_lexer("echo $PATH", test_num++);
	test_lexer("exit", test_num++);
	test_lexer("unset PATH", test_num++);

	printf("\n>>> POTENTIAL ERROR CASES <<<\n");
	test_lexer("echo \"unclosed", test_num++);  // Unclosed double quote
	test_lexer("echo 'unclosed", test_num++);  // Unclosed single quote
	test_lexer("echo \"nested 'quote", test_num++);  // Unclosed with nested
	test_lexer("echo 'nested \"quote", test_num++);  // Unclosed with nested

	printf("========================================\n");
	printf("    TOTAL TESTS RUN: %d\n", test_num - 1);
	printf("========================================\n");

	return (0);
}

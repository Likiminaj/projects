/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   main.c                                             :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: cpesty <chlpesty@gmail.com>                +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/12/22 15:43:54 by chlpesty          #+#    #+#             */
/*   Updated: 2026/03/18 15:11:33 by cpesty           ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "minishell.h"
#include "../libft/libft.h"

void		ft_input_check(int argc);
int			shell_loop(t_env *env);
int			ft_process_line(char *line, t_env *env, int exit_status);

/* Runs a minimalist command-line interpreter that mimics basic
bash functionality. */
int	main(int argc, char **argv, char **envp)
{
	t_env	*env;
	int		exit_status;

	(void) argv;
	ft_input_check(argc);
	env = ft_env_init(envp);
	if (!env)
		return (1);
	ft_interactive_signals();
	exit_status = shell_loop(env);
	rl_clear_history();
	ft_env_free(env);
	return (exit_status);
}

/* Checks user input (./minishell) and inform them that any 
additional argument was not taken into account in the launch. */
void	ft_input_check(int argc)
{
	if (argc > 1)
	{
		ft_printf("INFORMATION: Your shell was started but subsequent \
arguments were ignored.\n");
	}
}

/* Checks if Ctrl+C was pressed and update exit status
 accordingly. */
static void	ft_check_signal(int *exit_status)
{
	if (g_signal == SIGINT)
	{
		*exit_status = 130;
		g_signal = 0;
	}
}

/* Reads, save & processes a line inputed by the user until
an exit_status value is returned. */
int	shell_loop(t_env *env)
{
	char	*line;
	int		exit_status;

	exit_status = 0;
	while (1)
	{
		line = readline("minishell$ ");
		ft_check_signal(&exit_status);
		if (!line)
			return (ft_putendl_fd("exit", STDOUT_FILENO), exit_status);
		if (*line)
		{
			add_history(line);
			env->line_count++;
			line = ft_read_continuation(line, &exit_status);
			if (!line)
				continue ;
			exit_status = ft_process_line(line, env, exit_status);
		}
		free(line);
		if (env->should_exit)
			return (env->exit_status);
	}
}

/* Follows the steps to process a line : tokenization,
AST tree building, expansion, execution. */
int	ft_process_line(char *line, t_env *env, int exit_status)
{
	t_token	*tokens;
	t_ast	*ast;
	int		parse_status;

	parse_status = 0;
	tokens = ft_lex(line, &parse_status);
	if (!tokens)
	{
		if (parse_status)
			return (parse_status);
		return (exit_status);
	}
	ast = ms_parse(tokens, &parse_status);
	ft_free_tokens(&tokens);
	if (!ast)
	{
		if (parse_status)
			return (parse_status);
		return (exit_status);
	}
	if (!ft_expand_ast(ast, env, &exit_status))
		return (ft_free_ast(ast), 1);
	exit_status = ft_exec_ast(ast, env);
	return (ft_free_ast(ast), exit_status);
}

/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   main.c                                             :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: chlpesty <chlpesty@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/12/22 15:43:54 by chlpesty          #+#    #+#             */
/*   Updated: 2026/02/26 16:33:48 by chlpesty         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "minishell.h"
#include "../libft/libft.h"

static void	ft_check_signal(int *exit_status)
{
	if (g_signal == SIGINT)
	{
		*exit_status = 130;
		g_signal = 0;
	}
}

void	ft_input_check(int argc)
{
	if (argc > 1)
	{
		ft_printf("Your shell was started but subsequent arguments \
were ignored");
	}
}

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
			exit_status = ft_process_line(line, env, exit_status);
		}
		free(line);
		if (env->should_exit)
			return (env->exit_status);
	}
}

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
